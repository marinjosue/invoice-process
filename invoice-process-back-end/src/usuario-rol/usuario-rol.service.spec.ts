// src/usuario-rol/usuario-rol.service.spec.ts
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsuarioRolService } from './usuario-rol.service';
import { UsuarioRol } from './schemas/usuario-rol.schema';
import { User } from '../users/schemas/user.schema';
import { Role } from '../roles/schemas/role.schema';

describe('UsuarioRolService', () => {
  let service: UsuarioRolService;
  let usuarioRolModel: any;
  let userModel: any;
  let roleModel: any;

  beforeEach(async () => {
    usuarioRolModel = {
      find: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    };
    userModel = { updateOne: jest.fn().mockResolvedValue({}), find: jest.fn() };
    roleModel = {};

    const ref = await Test.createTestingModule({
      providers: [
        UsuarioRolService,
        { provide: getModelToken(UsuarioRol.name), useValue: usuarioRolModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Role.name), useValue: roleModel },
      ],
    }).compile();
    service = ref.get(UsuarioRolService);
  });

  it('getRoleNames devuelve los nombres de roles activos', async () => {
    usuarioRolModel.find.mockReturnValue({
      populate: () => ({ exec: () => Promise.resolve([
        { rolId: { name: 'admin' } },
        { rolId: { name: 'viewer' } },
      ]) }),
    });
    await expect(service.getRoleNames('u1')).resolves.toEqual(['admin', 'viewer']);
  });

  it('assignRoles reemplaza el set y sincroniza rolId con el primero', async () => {
    await service.assignRoles('u1', ['r1', 'r2']);
    expect(usuarioRolModel.deleteMany).toHaveBeenCalledWith({ usuarioId: 'u1' });
    expect(usuarioRolModel.create).toHaveBeenCalledTimes(2);
    expect(userModel.updateOne).toHaveBeenCalledWith({ _id: 'u1' }, { rolId: 'r1' });
  });

  it('assignRoles con lista vacía lanza error', async () => {
    await expect(service.assignRoles('u1', [])).rejects.toBeDefined();
  });
});
