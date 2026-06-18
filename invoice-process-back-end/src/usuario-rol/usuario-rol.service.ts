// src/usuario-rol/usuario-rol.service.ts
import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsuarioRol } from './schemas/usuario-rol.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class UsuarioRolService implements OnModuleInit {
  constructor(
    @InjectModel(UsuarioRol.name) private usuarioRolModel: Model<UsuarioRol>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /** Migración idempotente: cada usuario con rolId pero sin UsuarioRol obtiene su fila. */
  async onModuleInit(): Promise<void> {
    try {
      const users = await this.userModel.find({}, '_id rolId').exec();
      for (const u of users) {
        if (!u.rolId) continue;
        try {
          const exists = await this.usuarioRolModel
            .findOne({ usuarioId: u._id, rolId: u.rolId })
            .exec();
          if (!exists) {
            await this.usuarioRolModel.create({ usuarioId: u._id, rolId: u.rolId });
          }
        } catch (err: any) {
          if (err?.code !== 11000) {
            console.warn(`Migración UsuarioRol: usuario ${u._id} omitido:`, err?.message);
          }
          // duplicado (11000) o error puntual → continuar sin abortar el arranque
        }
      }
    } catch (err: any) {
      console.warn('Migración UsuarioRol omitida:', err?.message);
    }
  }

  /** Nombres de los roles activos de un usuario. */
  async getRoleNames(userId: string): Promise<string[]> {
    const rows = await this.usuarioRolModel
      .find({ usuarioId: new Types.ObjectId(userId), estado: 'active' })
      .populate('rolId', 'name')
      .exec();
    return rows.map((r: any) => r.rolId?.name).filter(Boolean);
  }

  /** Reemplaza el conjunto de roles del usuario; sincroniza rolId con el primero. */
  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    if (!roleIds || roleIds.length === 0) {
      throw new BadRequestException('Debe asignar al menos un rol');
    }
    // IMPORTANTE: convertir a ObjectId (como el resto del código). Si se pasan
    // strings crudos, Mongoose los guarda como String y deja de coincidir con
    // las filas ObjectId → deleteMany no borra y el listado no las trae.
    const uid = new Types.ObjectId(userId);
    await this.usuarioRolModel.deleteMany({ usuarioId: uid });
    for (const rolId of roleIds) {
      await this.usuarioRolModel.create({ usuarioId: uid, rolId: new Types.ObjectId(rolId) });
    }
    await this.userModel.updateOne({ _id: uid }, { rolId: new Types.ObjectId(roleIds[0]) });
  }

  /** Lista usuarios del tenant con persona y roles. */
  async listUsersWithRoles(tenantId: string): Promise<any[]> {
    const users = await this.userModel
      .find()
      .populate({ path: 'personaId', select: 'firstName lastName email tenantId' })
      .exec();
    const result: any[] = [];
    for (const u of users) {
      const persona: any = u.personaId;
      if (!persona || String(persona.tenantId) !== String(tenantId)) continue;
      const rows = await this.usuarioRolModel
        .find({ usuarioId: u._id, estado: 'active' })
        .populate('rolId', 'name')
        .exec();
      result.push({
        id: u._id,
        username: u.username,
        estado: u.status,
        persona: {
          firstName: persona.firstName,
          lastName: persona.lastName,
          email: persona.email,
        },
        roles: rows.map((r: any) => ({ id: r.rolId?._id, name: r.rolId?.name })),
      });
    }
    return result;
  }
}
