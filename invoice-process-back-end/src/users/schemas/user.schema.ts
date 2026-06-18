import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

/**
 * USER (modelo lógico): la cuenta de acceso.
 * - Datos personales -> Persona (User.personaId, 1:1)
 * - Rol             -> Role    (User.rolId)
 * El login sigue siendo por email, pero el email vive en Persona.
 */
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Person', required: true, unique: true })
  personaId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  rolId: Types.ObjectId;

  // Extra (fuera del modelo lógico, para "olvidé mi contraseña")
  @Prop({ type: String, default: null })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpire: Date | null;

  matchPassword: (enteredPassword: string) => Promise<boolean>;
  getResetPasswordToken: () => string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password antes de guardar
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Métodos de instancia
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getResetPasswordToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};
