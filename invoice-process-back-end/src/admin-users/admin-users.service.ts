// src/admin-users/admin-users.service.ts
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Person } from '../persons/schemas/person.schema';
import { Role } from '../roles/schemas/role.schema';
import { UsuarioRolService } from '../usuario-rol/usuario-rol.service';
import { CreatePersonaDto, CreateUsuarioDto, CreateRolDto } from './dto/admin-users.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Person.name) private personaModel: Model<Person>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
    private usuarioRolService: UsuarioRolService,
  ) {}

  async createPersona(tenantId: string, dto: CreatePersonaDto) {
    const email = dto.email.toLowerCase();
    const dup = await this.personaModel
      .findOne({ $or: [{ email }, { identification: dto.identification }] })
      .exec();
    if (dup) throw new ConflictException('Email o identificación ya registrados');
    return this.personaModel.create({
      identification: dto.identification,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      phone: dto.phone ?? null,
      tenantId: new Types.ObjectId(tenantId),
    });
  }

  async listRoles() {
    return this.roleModel.find().select('name description').sort({ name: 1 }).exec();
  }

  async createRol(dto: CreateRolDto) {
    const dup = await this.roleModel.findOne({ name: dto.name }).exec();
    if (dup) throw new ConflictException('El rol ya existe');
    return this.roleModel.create({ name: dto.name, description: dto.description ?? '' });
  }

  async createUsuario(dto: CreateUsuarioDto) {
    const persona = await this.personaModel.findById(dto.personaId).exec();
    if (!persona) throw new BadRequestException('Persona no encontrada');
    const existing = await this.userModel.findOne({ personaId: persona._id }).exec();
    if (existing) throw new ConflictException('La persona ya tiene usuario');

    const user = await this.userModel.create({
      username: dto.username.toLowerCase(),
      password: dto.password,
      status: 'active',
      personaId: persona._id,
      rolId: new Types.ObjectId(dto.roleIds[0]),
    });
    await this.usuarioRolService.assignRoles(String(user._id), dto.roleIds);
    return { id: user._id, username: user.username };
  }
}
