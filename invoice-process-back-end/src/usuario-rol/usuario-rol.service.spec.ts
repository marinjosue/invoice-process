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

  // Ids hex válidos (el servicio los convierte con new Types.ObjectId(...)).
  const UID = '507f1f77bcf86cd799439011';
  const R1 = '507f1f77bcf86cd799439012';
  const R2 = '507f1f77bcf86cd799439013';

  it('getRoleNames devuelve los nombres de roles activos (consulta por ObjectId)', async () => {
    usuarioRolModel.find.mockReturnValue({
      populate: () => ({ exec: () => Promise.resolve([
        { rolId: { name: 'admin' } },
        { rolId: { name: 'viewer' } },
      ]) }),
    });
    await expect(service.getRoleNames(UID)).resolves.toEqual(['admin', 'viewer']);
    const arg = usuarioRolModel.find.mock.calls[0][0];
    expect(String(arg.usuarioId)).toBe(UID); // se consulta como ObjectId, no como string
    expect(arg.estado).toBe('active');
  });

  it('assignRoles reemplaza el set y sincroniza rolId (todo como ObjectId)', async () => {
    await service.assignRoles(UID, [R1, R2]);

    expect(String(usuarioRolModel.deleteMany.mock.calls[0][0].usuarioId)).toBe(UID);
    expect(usuarioRolModel.create).toHaveBeenCalledTimes(2);
    const c0 = usuarioRolModel.create.mock.calls[0][0];
    const c1 = usuarioRolModel.create.mock.calls[1][0];
    expect(String(c0.usuarioId)).toBe(UID);
    expect(String(c0.rolId)).toBe(R1);
    expect(String(c1.rolId)).toBe(R2);
    const [filtro, cambio] = userModel.updateOne.mock.calls[0];
    expect(String(filtro._id)).toBe(UID);
    expect(String(cambio.rolId)).toBe(R1);
  });

  it('assignRoles con lista vacía lanza error', async () => {
    await expect(service.assignRoles(UID, [])).rejects.toThrow();
  });

  it('onModuleInit no aborta si un create falla con 11000', async () => {
    userModel.find.mockReturnValue({ exec: () => Promise.resolve([{ _id: 'u1', rolId: 'r1' }]) });
    usuarioRolModel.findOne = jest.fn().mockReturnValue({ exec: () => Promise.resolve(null) });
    usuarioRolModel.create.mockRejectedValueOnce({ code: 11000 });
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
