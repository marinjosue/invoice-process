import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * ROLE (modelo lógico): catálogo de roles.
 * Relación 1:N con User (User.rolId -> Role).
 */
@Schema({ timestamps: true, collection: 'role' })
export class Role extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
