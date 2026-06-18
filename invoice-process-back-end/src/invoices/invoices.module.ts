import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { InvoiceItem, InvoiceItemSchema } from './schemas/invoice-item.schema';
import { InvoicesController } from './invoices.controller';
import { ValidationController } from './validation.controller';
import { InvoicesService } from './invoices.service';
import { GeminiService } from './gemini.service';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { PdfStorageService } from '../services/pdf-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceItem.name, schema: InvoiceItemSchema },
    ]),
    AuthModule,
    ProductsModule,
    SuppliersModule,
  ],
  controllers: [InvoicesController, ValidationController],
  providers: [
    InvoicesService,
    GeminiService,
    PdfStorageService
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
