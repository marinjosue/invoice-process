import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfilePictureService {
  private storage: Storage;
  private bucketName = 'sistema-liquidaciones';
  private folderPath = 'profile/';

  constructor() {
    this.storage = new Storage({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${this.folderPath}${userId}-${uuidv4()}.${fileExtension}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      const [signedUrl] = await fileUpload.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      return signedUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error('Error al subir la imagen de perfil');
    }
  }

  async deleteProfilePicture(pictureUrl: string): Promise<void> {
    try {
      const fileName = pictureUrl.split(`${this.bucketName}/`)[1];
      if (fileName && fileName.startsWith(this.folderPath)) {
        const bucket = this.storage.bucket(this.bucketName);
        await bucket.file(fileName).delete();
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
    }
  }
}
