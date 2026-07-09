import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { User } from '../users/schemas/user.schema';
import { Person } from '../persons/schemas/person.schema';
import { Role } from '../roles/schemas/role.schema';
import { UsuarioRolService } from '../usuario-rol/usuario-rol.service';

describe('AdminUsersService roles', () => {
  let service: AdminUsersService; let roleModel: any;
  beforeEach(async () => {
    roleModel = { findOne: jest.fn(), create: jest.fn(), findById: jest.fn(), updateOne: jest.fn().mockResolvedValue({}), find: jest.fn() };
    const ref = await Test.createTestingModule({ providers: [
      AdminUsersService,
      { provide: getModelToken(User.name), useValue: {} },
      { provide: getModelToken(Person.name), useValue: {} },
      { provide: getModelToken(Role.name), useValue: roleModel },
      { provide: UsuarioRolService, useValue: {} },
    ]}).compile();
    service = ref.get(AdminUsersService);
  });
  it('createRol guarda permissions', async () => {
    roleModel.findOne.mockReturnValue({ exec: () => Promise.resolve(null) });
    roleModel.create.mockResolvedValue({ _id: 'r1' });
    await service.createRol({ name: 'auditor', description: 'x', permissions: ['dashboard','settlements'] } as any);
    expect(roleModel.create).toHaveBeenCalledWith({ name: 'auditor', description: 'x', permissions: ['dashboard','settlements'] });
  });
  it('updateRol cambia permissions', async () => {
    roleModel.findById.mockReturnValue({ exec: () => Promise.resolve({ _id: 'r1', name: 'auditor' }) });
    await service.updateRol('r1', ['products']);
    expect(roleModel.updateOne).toHaveBeenCalledWith({ _id: 'r1' }, { permissions: ['products'] });
  });
  it('updateRol NO permite editar admin', async () => {
    roleModel.findById.mockReturnValue({ exec: () => Promise.resolve({ _id: 'r1', name: 'admin' }) });
    await expect(service.updateRol('r1', [])).rejects.toBeInstanceOf(ForbiddenException);
  });
});
