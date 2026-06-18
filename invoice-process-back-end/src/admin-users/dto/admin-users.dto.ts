import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

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
}

export class AssignRolesDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) roleIds: string[];
}
