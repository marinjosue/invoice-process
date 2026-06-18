import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
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

    return user;
  }
}
