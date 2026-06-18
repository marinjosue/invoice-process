import { Injectable, Logger } from '@nestjs/common';
import { GoogleCloudConfig } from '../config/google-cloud.config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PdfStorageService {
    private readonly logger = new Logger(PdfStorageService.name);
    private get bucket() {
        return GoogleCloudConfig.getBucket();
    }

    async uploadPdf(
        file: Express.Multer.File,
        folder: string = 'invoices',
    ): Promise<{ fileName: string; signedUrl: string; gcsPath: string }> {
        try {
            if (!file || !file.buffer) {
                throw new Error('Archivo o buffer no válido');
            }

            this.logger.log(`Iniciando subida - Archivo: ${file.originalname}, Tamaño: ${file.buffer.length} bytes`);

            const safeOriginal = (file.originalname || 'documento.pdf')
                .replace(/[^\w.\-() ]+/g, '_');
            const gcsPath = `${folder}/${uuidv4()}-${safeOriginal}`;

            this.logger.log(`Ruta GCS: ${gcsPath}`);

            const gcsFile = this.bucket.file(gcsPath);

            const [bucketExists] = await this.bucket.exists();
            if (!bucketExists) {
                throw new Error('El bucket no existe');
            }

            this.logger.log(`Bucket verificado, procediendo con subida privada sin ACL legacy...`);

            await new Promise<void>((resolve, reject) => {
                const stream = gcsFile.createWriteStream({
                    resumable: false,
                    validation: false,
                    metadata: {
                        contentType: file.mimetype || 'application/pdf',
                    },
                });

                stream.on('error', reject);
                stream.on('finish', resolve);
                stream.end(file.buffer);
            });

            this.logger.log(`Archivo subido exitosamente: ${gcsPath}`);

            const signedUrl = await this.getSignedUrl(gcsPath, 30, 'inline', safeOriginal);

            this.logger.log(`URL pública generada`);

            return { fileName: file.originalname, signedUrl, gcsPath };
        } catch (error: any) {
            this.logger.error(`Error completo al subir PDF:`, {
                message: error.message,
                code: error.code,
                name: error.name,
                details: error.details || 'No details',
                stack: error.stack?.split('\n').slice(0, 5),
            });
            throw new Error(`Error al subir PDF: ${error.message}`);
        }
    }

    async downloadPdf(gcsPath: string): Promise<Buffer> {
        try {
            const file = this.bucket.file(gcsPath);
            const [buffer] = await file.download();
            return buffer;
        } catch (error: any) {
            throw new Error(`Error al descargar PDF: ${error.message}`);
        }
    }

    // Returns the standard public GCS URL (only works if bucket-level IAM allows public reads)
    private getPublicUrl(gcsPath: string): string {
        const bucketName = this.bucket.name;
        return `https://storage.googleapis.com/${bucketName}/${gcsPath}`;
    }

    async getSignedUrl(
        gcsPath: string,
        expirationMinutes: number = 30,
        disposition: 'inline' | 'attachment' = 'inline',
        filename?: string,
    ): Promise<string> {
        try {
            const file = this.bucket.file(gcsPath);
            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expirationMinutes * 60 * 1000,
                responseDisposition: `${disposition}; filename="${filename || path.basename(gcsPath)}"`,
            });

            return url;
        } catch (error: any) {
            this.logger.warn(`No se pudo generar URL firmada para ${gcsPath}: ${error.message}`);
            return this.getPublicUrl(gcsPath);
        }
    }

    async deletePdf(gcsPath: string): Promise<void> {
        try {
            this.logger.log(`Intentando eliminar archivo: ${gcsPath}`);
            
            const file = this.bucket.file(gcsPath);
            const [exists] = await file.exists();
            
            if (!exists) {
                this.logger.warn(`El archivo no existe en GCS: ${gcsPath}`);
                return;
            }
            
            await file.delete();
            this.logger.log(`Archivo eliminado exitosamente de GCS: ${gcsPath}`);
        } catch (error: any) {
            this.logger.error(`Error al eliminar PDF de GCS:`, {
                gcsPath,
                message: error.message,
                code: error.code,
                details: error.details
            });
            throw new Error(`Error al eliminar PDF: ${error.message}`);
        }
    }

    async listPdfs(folder: string = 'invoices') {
        try {
            const [files] = await this.bucket.getFiles({ prefix: `${folder}/` });

            return files.map((file) => ({
                name: path.basename(file.name),
                size: Number(file.metadata.size || 0),
                updated: new Date(file.metadata.updated || Date.now()),
                gcsPath: file.name,
            }));
        } catch (error: any) {
            throw new Error(`Error al listar PDFs: ${error.message}`);
        }
    }

    async fileExists(gcsPath: string): Promise<boolean> {
        try {
            const [exists] = await this.bucket.file(gcsPath).exists();
            return exists;
        } catch {
            return false;
        }
    }
}
