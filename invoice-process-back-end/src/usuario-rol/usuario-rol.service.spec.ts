// src/usuario-rol/usuario-rol.service.spec.ts
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsuarioRolService } from './usuario-rol.service';
import { UsuarioRol } from './schemas/usuario-rol.schema';
import { User } from '../users/schemas/user.schema';

describe('UsuarioRolService', () => {
  let service: UsuarioRolService;
  let usuarioRolModel: any;
  let userModel: any;

  beforeEach(async () => {
    usuarioRolModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    };
    userModel = { updateOne: jest.fn().mockResolvedValue({}), find: jest.fn() };

    const ref = await Test.createTestingModule({
      providers: [
        UsuarioRolService,
        { provide: getModelToken(UsuarioRol.name), useValue: usuarioRolModel },
        { provide: getModelToken(User.name), useValue: userModel },
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
    expect(usuarioRolModel.find).toHaveBeenCalledWith({ usuarioId: 'u1', estado: 'active' });
  });

  it('assignRoles reemplaza el set y sincroniza rolId con el primero', async () => {
    await service.assignRoles('u1', ['r1', 'r2']);
    expect(usuarioRolModel.deleteMany).toHaveBeenCalledWith({ usuarioId: 'u1' });
    expect(usuarioRolModel.create).toHaveBeenCalledTimes(2);
    expect(usuarioRolModel.create).toHaveBeenCalledWith({ usuarioId: 'u1', rolId: 'r1' });
    expect(usuarioRolModel.create).toHaveBeenCalledWith({ usuarioId: 'u1', rolId: 'r2' });
    expect(userModel.updateOne).toHaveBeenCalledWith({ _id: 'u1' }, { rolId: 'r1' });
  });

  it('assignRoles con lista vacía lanza error', async () => {
    await expect(service.assignRoles('u1', [])).rejects.toThrow();
  });

  it('onModuleInit no aborta si un create falla con 11000', async () => {
    userModel.find.mockReturnValue({ exec: () => Promise.resolve([{ _id: 'u1', rolId: 'r1' }]) });
    usuarioRolModel.findOne = jest.fn().mockReturnValue({ exec: () => Promise.resolve(null) });
    usuarioRolModel.create.mockRejectedValueOnce({ code: 11000 });
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
