import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  supplierId: string; // ID único del proveedor (puede ser RUC, NIT, etc.)

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  currency: string;

  @Prop({ type: String })
  taxId: string; // RUC, NIT, Tax ID

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  postalCode: string;

  @Prop({ type: String })
  website: string;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: String })
  paymentTerms: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  invoiceCount: number;

  @Prop({ type: Number, default: 0 })
  totalPurchases: number;

}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

SupplierSchema.index({ tenantId: 1, supplierId: 1 }, { unique: true });
SupplierSchema.index({ tenantId: 1, name: 1 });
SupplierSchema.index({ tenantId: 1, taxId: 1 });
