import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: false })
  supplierId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: 'UND' })
  unit: string;

  @Prop({ type: Number, default: 0 })
  estimatedCost: number;

  @Prop({ type: Number, default: 0 })
  currentStock: number;

  @Prop({ type: Number, default: 0 })
  minStock: number;

  @Prop({ type: String, default: '' })
  warehouseLocation: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ tenantId: 1, supplierId: 1 });
ProductSchema.index({ tenantId: 1, categoryId: 1 });
