import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT'
}

@Schema({ timestamps: true })
export class InventoryMovement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(MovementType), 
    required: true 
  })
  type: MovementType;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, default: 0 })
  previousStock: number;

  @Prop({ type: Number, default: 0 })
  newStock: number;

  @Prop({ type: Date, default: Date.now })
  movementDate: Date;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  invoiceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Settlement' })
  settlementId?: Types.ObjectId;

  @Prop({ type: String })
  notes?: string;
}

export const InventoryMovementSchema = SchemaFactory.createForClass(InventoryMovement);

InventoryMovementSchema.index({ tenantId: 1, productId: 1, movementDate: -1 });
InventoryMovementSchema.index({ tenantId: 1, type: 1 });
InventoryMovementSchema.index({ tenantId: 1, userId: 1 });
