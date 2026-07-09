import { SetMetadata } from '@nestjs/common';

export const RequierePermiso = (permission: string) => SetMetadata('permission', permission);
