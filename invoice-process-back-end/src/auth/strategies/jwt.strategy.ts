import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UsuarioRolService } from '../../usuario-rol/usuario-rol.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private usuarioRolService: UsuarioRolService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'fallback-secret-key';
    console.log('JwtStrategy inicializado con secreto:', secret ? 'Configurado' : 'NO CONFIGURADO');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    if (!user.tenantId || !user.tenantId['isActive']) {
      throw new UnauthorizedException('Organización desactivada');
    }

    const roles = await this.usuarioRolService.getRoleNames(String(user._id));
    const permissions = await this.usuarioRolService.getUserPermissions(String(user._id));
    return { ...user, roles: roles.length ? roles : [user.role].filter(Boolean), permissions };
  }
}
