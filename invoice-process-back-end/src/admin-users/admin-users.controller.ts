// src/admin-users/admin-users.controller.ts
import { Controller, Post, Put, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequierePermiso } from '../common/decorators/require-permission.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AdminUsersService } from './admin-users.service';
import { UsuarioRolService } from '../usuario-rol/usuario-rol.service';
import { CreatePersonaDto, CreateUsuarioDto, CreateRolDto, AssignRolesDto, UpdateRolDto } from './dto/admin-users.dto';

@ApiTags('Admin · Usuarios')
@ApiBearerAuth('bearer')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequierePermiso('admin.users')
export class AdminUsersController {
  constructor(
    private adminUsersService: AdminUsersService,
    private usuarioRolService: UsuarioRolService,
  ) {}

  @Post('personas')
  createPersona(@Body() dto: CreatePersonaDto, @GetUser('tenantId') tenantId: any) {
    return this.adminUsersService.createPersona(tenantId._id.toString(), dto);
  }

  @Post('usuarios')
  createUsuario(@Body() dto: CreateUsuarioDto) {
    return this.adminUsersService.createUsuario(dto);
  }

  @Post('roles')
  createRol(@Body() dto: CreateRolDto) {
    return this.adminUsersService.createRol(dto);
  }

  @Put('usuarios/:id/roles')
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    await this.usuarioRolService.assignRoles(id, dto.roleIds);
    return { success: true };
  }

  @Get('roles')
  listRoles() {
    return this.adminUsersService.listRoles();
  }

  @Get('usuarios')
  listUsuarios(@GetUser('tenantId') tenantId: any) {
    return this.usuarioRolService.listUsersWithRoles(tenantId._id.toString());
  }

  @Get('pages')
  listPages() {
    return this.adminUsersService.listPages();
  }

  @Put('roles/:id')
  updateRol(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    return this.adminUsersService.updateRol(id, dto.permissions);
  }
}
