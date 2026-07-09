import { IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty, Matches, MinLength } from 'class-validator';
import { PAGE_KEYS } from '../../common/rbac/pages';

export class CreatePersonaDto {
  @IsString() @IsNotEmpty() @Matches(/^\d+$/, { message: 'La identificación debe ser solo números' }) identification: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail() email: string;
  @IsOptional() @Matches(/^\d+$/, { message: 'El teléfono debe ser solo números' }) phone?: string;
}

export class CreateUsuarioDto {
  @IsString() @IsNotEmpty() personaId: string;
  @IsString() @IsNotEmpty() username: string;
  @IsString() @MinLength(6) password: string;
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) roleIds: string[];
}

export class CreateRolDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @IsIn(PAGE_KEYS, { each: true }) permissions: string[];
}

export class UpdateRolDto {
  @IsArray() @IsIn(PAGE_KEYS, { each: true }) permissions: string[];
}

export class AssignRolesDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) roleIds: string[];
}
