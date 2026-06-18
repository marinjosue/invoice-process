import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register-user')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Registrar nuevo usuario (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Put('reset-password/:resetToken')
  async resetPassword(
    @Param('resetToken') resetToken: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(resetToken, resetPasswordDto);
  }

  @Get('users/me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@GetUser('_id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Get('test-auth')
  @UseGuards(AuthGuard('jwt'))
  async testAuth(@GetUser() user: any) {
    return {
      success: true,
      message: 'Autenticación funcionando correctamente',
      user: {
        id: user._id,
        email: user.email,
        tenantId: user.tenantId
      }
    };
  }
}
