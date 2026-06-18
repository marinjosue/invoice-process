import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';

describe('AuthService.getMe', () => {
  let service: AuthService;
  const usersService = { findById: jest.fn(), findByEmail: jest.fn() } as any;
  const jwtServiceMock = { sign: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: EmailService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('incluye permissions según el rol del usuario', async () => {
    usersService.findById.mockResolvedValue({
      _id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B',
      role: 'viewer', tenantId: { _id: 't1', name: 'ESPE' }, profilePicture: null,
    });

    const res = await service.getMe('u1');

    expect(res.user.role).toBe('viewer');
    expect(res.user.permissions).toEqual(['dashboard', 'invoices.manage', 'settlements']);
  });

  it('login incluye permissions del rol resuelto', async () => {
    const fakeUser: any = {
      _id: { toString: () => 'u1' },
      status: 'active',
      matchPassword: jest.fn().mockResolvedValue(true),
      personaId: {
        email: 'admin@espe.edu.ec',
        firstName: 'Ada',
        lastName: 'Admin',
        profilePicture: null,
        tenantId: { _id: 't1', name: 'ESPE', subdomain: 'espe', isActive: true },
      },
      rolId: { name: 'admin' },
    };
    usersService.findByEmail.mockResolvedValue(fakeUser);
    (jwtServiceMock.sign as jest.Mock).mockReturnValue('jwt.token');

    const res = await service.login({ email: 'admin@espe.edu.ec', password: 'secret' });

    expect(res.user.role).toBe('admin');
    expect(res.user.permissions).toEqual([
      'dashboard', 'providers', 'products', 'categories', 'inventory',
      'invoices.upload', 'invoices.manage', 'settlements', 'admin.users',
    ]);
  });
});
