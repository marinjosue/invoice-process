import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  ubicacionArchivo: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    gcsPath?: string;
  };

  @Prop({ type: Object, required: true })
  metadatosCarga: {
    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
  };

  @Prop({ 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'EXTRACTED', 'VALIDATED', 'FINALIZED', 'ERROR'],
    default: 'PENDING'
  })
  status: string;

  @Prop({ type: Number, min: 0, max: 100 })
  confianzaExtraccion: number;

  @Prop({ type: Object })
  extractedJson: any;

  @Prop({ type: String })
  invoiceNumber: string;

  @Prop({ type: Date })
  invoiceDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Supplier' })
  supplierId: Types.ObjectId;

  @Prop({ type: String })
  supplierName: string;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: [Object] })
  items: Array<{
    itemId: string;
    productId?: Types.ObjectId;
    sku: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalLine: number;
  }>;

  @Prop({ type: [String] })
  warnings: string[];

  @Prop({ type: [String] })
  processingErrors: string[];
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.index({ tenantId: 1, createdAt: -1 });
InvoiceSchema.index({ estadoProcesamiento: 1 });

@Schema()
export class UbicacionArchivo {
  @Prop({ required: true })
  fileName: string;

  @Prop()
  fileSize: number;

  @Prop()
  mimeType: string;

  @Prop()
  gcsPath?: string;
}
