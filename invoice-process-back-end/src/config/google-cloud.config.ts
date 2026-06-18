import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class GoogleCloudConfig {
  private static storage: Storage;

  private static getBucketName(): string {
    const bucketName = process.env.GCS_BUCKET;

    if (!bucketName) {
      throw new Error('GCS_BUCKET no está configurado en las variables de entorno');
    }
    return bucketName;
  }

  private static setupCredentials() {
    const rawKey = process.env.GCP_SA_KEY;

    if (rawKey) {
      // GCP_SA_KEY takes priority — used for local development
      try {
        const keyObject = JSON.parse(rawKey);

        if (keyObject.private_key) {
          keyObject.private_key = keyObject.private_key.replace(/\\n/g, '\n');
        }

        const filePath = path.join(os.tmpdir(), 'gcp-sa-key.json');
        fs.writeFileSync(filePath, JSON.stringify(keyObject, null, 2), { encoding: 'utf8' });

        process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
        console.log('Credenciales de Google Cloud configuradas desde GCP_SA_KEY');
      } catch (error) {
        throw new Error(`Error al procesar credenciales GCP: ${error.message}`);
      }
    } else {
      // On Cloud Run: Application Default Credentials are provided automatically
      // by the Cloud Run service account — no extra config needed.
      console.log('Usando Application Default Credentials (Cloud Run / ADC)');
    }
  }

  static getStorage(): Storage {
    if (!this.storage) {
      this.setupCredentials();

      // projectId is inferred from ADC / metadata server on Cloud Run
      this.storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID || undefined,
      });
    }
    return this.storage;
  }

  static getBucket() {
    return this.getStorage().bucket(this.getBucketName());
  }

  static async ensureBucketExists(): Promise<void> {
    const bucketName = this.getBucketName();
    const bucket = this.getBucket();

    try {
      const [exists] = await bucket.exists();

      if (exists) {
        console.log(`✅ Bucket '${bucketName}' ya existe`);
        return;
      }

      console.log(`📦 Creando bucket '${bucketName}'...`);
      await this.getStorage().createBucket(bucketName, {
        location: 'US',
        storageClass: 'STANDARD',
      });

      console.log(`Bucket '${bucketName}' creado exitosamente`);
    } catch (error) {
      console.error(`Error al verificar/crear bucket '${bucketName}':`, error.message);
      throw error;
    }
  }
}
