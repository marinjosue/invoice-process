import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { ProfileController } from './profile.controller';
import { ProfilePictureService } from './profile-picture.service';
import { PersonsModule } from '../persons/persons.module';
import { RolesModule } from '../roles/roles.module';
import { AdminUsersModule } from '../admin-users/admin-users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PersonsModule,
    RolesModule,
    AdminUsersModule,
  ],
  controllers: [ProfileController],
  providers: [UsersService, ProfilePictureService],
  exports: [UsersService],
})
export class UsersModule {}
