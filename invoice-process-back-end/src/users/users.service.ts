import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Person } from '../persons/schemas/person.schema';
import { Role } from '../roles/schemas/role.schema';

/**
 * Forma "aplanada" del usuario que consume el resto de la app (req.user).
 * Mantiene la compatibilidad con el código previo: expone tenantId (poblado),
 * role (nombre), email, firstName, etc. tomados de Persona/Role.
 */
export interface FlatUser {
  _id: any;
  username: string;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profilePicture: string | null;
  role: string;
  rolId: any;
  personaId: any;
  tenantId: any;
  createdAt?: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Person.name) private personaModel: Model<Person>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
  ) {}

  /**
   * Usuario real (documento Mongoose) con persona+tenant+rol poblados y password.
   * Pensado para autenticación (matchPassword/save). Busca por el email de la Persona.
   */
  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const persona = await this.personaModel
      .findOne({ email: email.toLowerCase() })
      .exec();
    if (!persona) return null;

    return this.userModel
      .findOne({ personaId: persona._id })
      .select('+password')
      .populate({
        path: 'personaId',
        populate: { path: 'tenantId', select: 'name subdomain isActive' },
      })
      .populate('rolId', 'name description')
      .exec();
  }

  /**
   * Usuario "aplanado" (req.user). Compatible con controllers existentes.
   */
  async findById(id: string): Promise<FlatUser | null> {
    const user = await this.userModel
      .findById(id)
      .populate({
        path: 'personaId',
        populate: { path: 'tenantId', select: 'name subdomain isActive' },
      })
      .populate('rolId', 'name description')
      .exec();

    if (!user) return null;
    return this.toFlatUser(user);
  }

  /**
   * Crea Persona + User asociados y devuelve ambos junto al rol.
   * dto: { email, password, firstName, lastName, role(nombre), tenantId,
   *        identification, phone?, username? }
   */
  async create(
    dto: any,
  ): Promise<{ user: User; persona: Person; role: Role }> {
    const roleName = dto.role || 'user';
    const role = await this.roleModel.findOne({ name: roleName }).exec();
    if (!role) {
      throw new BadRequestException(`El rol '${roleName}' no existe`);
    }

    if (!dto.identification) {
      throw new BadRequestException('La identificación es obligatoria');
    }

    const email = (dto.email || '').toLowerCase();

    // Evita duplicados (email o identificación) antes de tocar la BD.
    const existing = await this.personaModel
      .findOne({ $or: [{ email }, { identification: dto.identification }] })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'El email o la identificación ya están registrados',
      );
    }

    const persona = await this.personaModel.create({
      identification: dto.identification,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      phone: dto.phone ?? null,
      tenantId: dto.tenantId,
    });

    try {
      const user = await this.userModel.create({
        username: (dto.username ?? email).toLowerCase(),
        password: dto.password,
        status: 'active',
        personaId: persona._id,
        rolId: role._id,
      });
      return { user, persona, role };
    } catch (err) {
      // Si falla la creación del User, no dejamos una Persona huérfana.
      await this.personaModel.deleteOne({ _id: persona._id }).exec();
      if (err && (err as any).code === 11000) {
        throw new BadRequestException('El usuario ya existe (datos duplicados)');
      }
      throw err;
    }
  }

  async findByResetToken(token: string): Promise<User | null> {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    return this.userModel
      .findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      })
      .select('+password')
      .exec();
  }

  /**
   * Actualiza datos de perfil. Esos campos viven ahora en Persona,
   * así que se aplican sobre la Persona ligada al usuario.
   */
  async updateProfile(
    userId: string,
    updateData: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      profilePicture: string;
    }>,
  ): Promise<FlatUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const allowed: any = {};
    if (updateData.firstName !== undefined) allowed.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) allowed.lastName = updateData.lastName;
    if (updateData.phone !== undefined) allowed.phone = updateData.phone;
    if (updateData.profilePicture !== undefined)
      allowed.profilePicture = updateData.profilePicture;

    await this.personaModel
      .findByIdAndUpdate(
        user.personaId,
        { $set: allowed },
        { new: true, runValidators: true },
      )
      .exec();

    const flat = await this.findById(userId);
    if (!flat) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return flat;
  }

  async updateProfilePicture(
    userId: string,
    pictureUrl: string,
  ): Promise<FlatUser> {
    return this.updateProfile(userId, { profilePicture: pictureUrl });
  }

  /** Construye la forma aplanada a partir de un User con persona/rol poblados. */
  private toFlatUser(user: User): FlatUser {
    const persona: any = user.personaId;
    const tenant: any = persona?.tenantId;
    const rol: any = user.rolId;

    return {
      _id: user._id,
      username: user.username,
      status: user.status,
      email: persona?.email,
      firstName: persona?.firstName,
      lastName: persona?.lastName,
      phone: persona?.phone ?? null,
      profilePicture: persona?.profilePicture ?? null,
      role: rol?.name,
      rolId: rol?._id ?? user.rolId,
      personaId: persona?._id ?? user.personaId,
      tenantId: tenant,
      createdAt: (user as any).createdAt,
    };
  }
}
