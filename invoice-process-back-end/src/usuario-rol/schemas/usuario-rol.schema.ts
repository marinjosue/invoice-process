// src/usuario-rol/schemas/usuario-rol.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** Tabla intermedia N:M entre User y Role. */
@Schema({ timestamps: true, collection: 'usuariorol' })
export class UsuarioRol extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  usuarioId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  rolId: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  fechaAsignacion: Date;

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  estado: string;
}

export const UsuarioRolSchema = SchemaFactory.createForClass(UsuarioRol);
UsuarioRolSchema.index({ usuarioId: 1, rolId: 1 }, { unique: true });
