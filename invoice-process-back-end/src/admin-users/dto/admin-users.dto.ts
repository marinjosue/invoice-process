import { IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { PAGE_KEYS } from '../../common/rbac/pages';

export class CreatePersonaDto {
  @IsString() @IsNotEmpty() identification: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
}

export class CreateUsuarioDto {
  @IsString() @IsNotEmpty() personaId: string;
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() password: string;
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
