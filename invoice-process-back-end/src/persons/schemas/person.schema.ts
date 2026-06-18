import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * PERSON (modelo lógico): datos personales.
 * Relación 1:1 con User (User.personaId -> Person).
 * El email vive aquí (es dato de la persona, no de la cuenta).
 */
@Schema({ timestamps: true, collection: 'person' })
export class Person extends Document {
  @Prop({ required: true, unique: true, trim: true })
  identification: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, default: null })
  phone: string | null;

  // Extra (fuera del modelo lógico, requerido por el código actual)
  @Prop({ type: String, default: null })
  profilePicture: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
