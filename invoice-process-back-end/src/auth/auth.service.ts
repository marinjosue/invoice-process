import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { permissionsForRoles } from '../common/rbac/role-permissions';
import { UsuarioRolService } from '../usuario-rol/usuario-rol.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private usuarioRolService: UsuarioRolService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Tu cuenta ha sido desactivada. Contacta al administrador');
    }

    const persona: any = user.personaId;
    const tenant: any = persona?.tenantId;
    const role: any = user.rolId;

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('La organización está desactivada');
    }

    const token = this.generateToken(user._id.toString());

    const roles = await this.usuarioRolService.getRoleNames(user._id.toString());
    const roleNames = roles.length ? roles : [role?.name].filter(Boolean) as string[];

    return {
      success: true,
      token,
      user: {
        id: user._id,
        email: persona?.email,
        firstName: persona?.firstName,
        lastName: persona?.lastName,
        role: role?.name,
        roles: roleNames,
        permissions: permissionsForRoles(roleNames),
        tenantId: tenant?._id,
        tenantName: tenant?.name,
        tenantSubdomain: tenant?.subdomain,
        profilePicture: persona?.profilePicture ?? null,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    const { user, persona, role } = await this.usersService.create(registerDto);

    return {
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: user._id,
        email: persona.email,
        firstName: persona.firstName,
        lastName: persona.lastName,
        role: role.name,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new BadRequestException('No existe una cuenta con este correo electrónico');
    }

    const persona: any = user.personaId;
    const resetToken = user.getResetPasswordToken();
    await user.save();

    try {
      await this.emailService.sendResetPasswordEmail(
        persona?.email,
        resetToken,
        persona?.firstName,
      );

      return {
        success: true,
        message: 'Email de recuperación enviado',
      };
    } catch (error) {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();

      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Error al enviar el email: ${message}`);
    }
  }

  async resetPassword(resetToken: string, resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetToken);

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    user.password = resetPasswordDto.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    const tenant: any = user.tenantId;

    const roles = await this.usuarioRolService.getRoleNames(user._id.toString());
    const roleNames = roles.length ? roles : [user.role].filter(Boolean) as string[];

    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roles: roleNames,
        permissions: permissionsForRoles(roleNames),
        tenantId: tenant?._id ?? tenant,
        tenantName: tenant?.name,
        tenantSubdomain: tenant?.subdomain,
        profilePicture: user.profilePicture ?? null,
      },
    };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ id: userId });
  }
}
