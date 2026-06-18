import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Tenant extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  subdomain: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  settings: {
    maxUsers?: number;
    features?: string[];
  };
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
