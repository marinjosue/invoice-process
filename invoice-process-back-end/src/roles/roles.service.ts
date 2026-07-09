import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './schemas/role.schema';
import { ROLE_PERMISSIONS } from '../common/rbac/role-permissions';

/**
 * Roles semilla. Se insertan una sola vez al arrancar (idempotente).
 * El guard de roles compara por `name`, así que estos nombres deben
 * coincidir con los usados en @Roles('admin'), etc.
 */
const DEFAULT_ROLES: Array<{ name: string; description: string }> = [
  { name: 'admin', description: 'Administrador del sistema' },
  { name: 'manager', description: 'Gestor / supervisor' },
  { name: 'user', description: 'Usuario estándar' },
  { name: 'viewer', description: 'Solo lectura' },
];

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultRoles();
  }

  async seedDefaultRoles(): Promise<void> {
    for (const role of DEFAULT_ROLES) {
      const permissions = ROLE_PERMISSIONS[role.name] ?? [];
      await this.roleModel.updateOne(
        { name: role.name },
        { $setOnInsert: { ...role, permissions } },
        { upsert: true },
      );
      // Rellenar permissions en roles que ya existían sin ellos.
      await this.roleModel.updateOne(
        { name: role.name, permissions: { $exists: false } },
        { $set: { permissions } },
      );
    }
  }

  findByName(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name }).exec();
  }
}
