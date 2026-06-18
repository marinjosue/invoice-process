// src/admin-users/admin-users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Person, PersonSchema } from '../persons/schemas/person.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import { UsuarioRol, UsuarioRolSchema } from '../usuario-rol/schemas/usuario-rol.schema';
import { UsuarioRolService } from '../usuario-rol/usuario-rol.service';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Role.name, schema: RoleSchema },
      { name: UsuarioRol.name, schema: UsuarioRolSchema },
    ]),
  ],
  controllers: [AdminUsersController],
  providers: [UsuarioRolService, AdminUsersService],
  exports: [UsuarioRolService],
})
export class AdminUsersModule {}
