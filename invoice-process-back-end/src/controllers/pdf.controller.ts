import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PdfStorageService } from '../services/pdf-storage.service';

@Controller('pdfs')
export class PdfController {
  constructor(private readonly pdfStorageService: PdfStorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new HttpException('No se proporcionó ningún archivo', HttpStatus.BAD_REQUEST);
    }

    if (file.mimetype !== 'application/pdf') {
      throw new HttpException('El archivo debe ser un PDF', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.pdfStorageService.uploadPdf(file, folder || 'invoices');
      return {
        success: true,
        message: 'PDF subido exitosamente',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Error al subir el archivo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download/*path')
  async downloadPdf(@Param('path') gcsPathParam: string | string[], @Res() res: Response) {
    const gcsPath = Array.isArray(gcsPathParam) ? gcsPathParam.join('/') : gcsPathParam;
    try {
      const buffer = await this.pdfStorageService.downloadPdf(gcsPath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${gcsPath.split('/').pop()}"`,
        'Content-Length': buffer.length,
      });
      
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        `Error al descargar el archivo: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('view/*path')
  async viewPdf(@Param('path') gcsPathParam: string | string[]) {
    const gcsPath = Array.isArray(gcsPathParam) ? gcsPathParam.join('/') : gcsPathParam;
    try {
      const url = await this.pdfStorageService.getSignedUrl(gcsPath, 60);
      return {
        success: true,
        url,
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener URL del archivo: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('list')
  async listPdfs(@Query('folder') folder?: string) {
    try {
      const files = await this.pdfStorageService.listPdfs(folder || 'invoices');
      return {
        success: true,
        count: files.length,
        data: files,
      };
    } catch (error) {
      throw new HttpException(
        `Error al listar archivos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('*path')
  async deletePdf(@Param('path') gcsPathParam: string | string[]) {
    const gcsPath = Array.isArray(gcsPathParam) ? gcsPathParam.join('/') : gcsPathParam;
    try {
      await this.pdfStorageService.deletePdf(gcsPath);
      return {
        success: true,
        message: 'PDF eliminado exitosamente',
      };
    } catch (error) {
      throw new HttpException(
        `Error al eliminar el archivo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
