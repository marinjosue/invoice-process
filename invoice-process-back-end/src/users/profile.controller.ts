import { Controller, Get, Put, Body, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ProfilePictureService } from './profile-picture.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Perfil')
@ApiBearerAuth('bearer')
@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(
    private usersService: UsersService,
    private profilePictureService: ProfilePictureService,
  ) {}

  @Get()
  async getProfile(@GetUser() user: any) {
    const profile = await this.usersService.findById(user._id.toString());
    
    if (!profile) {
      throw new BadRequestException('Perfil no encontrado');
    }

    return {
      success: true,
      user: {
        _id: profile._id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        profilePicture: profile.profilePicture,
        role: profile.role,
        tenantId: profile.tenantId,
        createdAt: (profile as any).createdAt,
      },
    };
  }

  @Put()
  async updateProfile(
    @GetUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // No permitir cambiar el email desde aquí (requiere verificación)
    delete updateProfileDto.email;
    
    const updatedUser = await this.usersService.updateProfile(
      user._id.toString(),
      updateProfileDto,
    );

    return {
      success: true,
      message: 'Perfil actualizado correctamente',
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
      },
    };
  }

  @Put('picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @GetUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar que sea una imagen
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('La imagen no debe superar los 5MB');
    }

    // Eliminar imagen anterior si existe
    const currentUser = await this.usersService.findById(user._id.toString());
    if (currentUser && currentUser.profilePicture) {
      await this.profilePictureService.deleteProfilePicture(currentUser.profilePicture);
    }

    // Subir nueva imagen
    const pictureUrl = await this.profilePictureService.uploadProfilePicture(
      user._id.toString(),
      file,
    );

    // Actualizar usuario
    const updatedUser = await this.usersService.updateProfilePicture(
      user._id.toString(),
      pictureUrl,
    );

    return {
      success: true,
      message: 'Foto de perfil actualizada correctamente',
      profilePicture: updatedUser.profilePicture,
    };
  }
}
