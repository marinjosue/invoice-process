import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class InvoiceItem extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true })
  invoiceId: Types.ObjectId;

  @Prop({ type: String, required: true })
  itemId: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ type: String })
  sku: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: Number, required: true, min: 0 })
  totalLine: number;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

InvoiceItemSchema.index({ invoiceId: 1 });
InvoiceItemSchema.index({ productId: 1 });
