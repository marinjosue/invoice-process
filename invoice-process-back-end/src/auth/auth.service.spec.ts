import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';

describe('AuthService.getMe', () => {
  let service: AuthService;
  const usersService = { findById: jest.fn() } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn() } },
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
});
