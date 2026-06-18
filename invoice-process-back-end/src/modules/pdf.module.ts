import { Module } from '@nestjs/common';
import { PdfController } from '../controllers/pdf.controller';
import { PdfStorageService } from '../services/pdf-storage.service';

@Module({
  controllers: [PdfController],
  providers: [PdfStorageService],
  exports: [PdfStorageService],
})
export class PdfModule {}
