import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

function ctx(perms?: string[]): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { permissions: perms } }) }),
    getHandler: () => null,
    getClass: () => null,
  } as any;
}

describe('PermissionsGuard', () => {
  it('pasa si no hay permiso requerido', () => {
    const g = new PermissionsGuard({ getAllAndOverride: () => undefined } as any);
    expect(g.canActivate(ctx(['x']))).toBe(true);
  });

  it('pasa si el usuario tiene el permiso', () => {
    const g = new PermissionsGuard({ getAllAndOverride: () => 'providers' } as any);
    expect(g.canActivate(ctx(['dashboard', 'providers']))).toBe(true);
  });

  it('deniega si el usuario no tiene el permiso', () => {
    const g = new PermissionsGuard({ getAllAndOverride: () => 'settlements' } as any);
    expect(g.canActivate(ctx(['dashboard']))).toBe(false);
  });
});
