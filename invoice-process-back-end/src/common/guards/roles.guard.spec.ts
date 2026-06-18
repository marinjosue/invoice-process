// invoice-process-back-end/src/common/guards/roles.guard.spec.ts
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function ctxWithRole(role?: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    getHandler: () => null,
    getClass: () => null,
  } as any;
}

describe('RolesGuard', () => {
  it('permite si no hay @Roles declarado', () => {
    const reflector = { getAllAndOverride: () => undefined } as any;
    const guard = new RolesGuard(reflector as Reflector);
    expect(guard.canActivate(ctxWithRole('viewer'))).toBe(true);
  });

  it('permite si el rol del usuario está en los requeridos', () => {
    const reflector = { getAllAndOverride: () => ['admin', 'manager'] } as any;
    const guard = new RolesGuard(reflector as Reflector);
    expect(guard.canActivate(ctxWithRole('manager'))).toBe(true);
  });

  it('deniega si el rol no está en los requeridos', () => {
    const reflector = { getAllAndOverride: () => ['admin'] } as any;
    const guard = new RolesGuard(reflector as Reflector);
    expect(guard.canActivate(ctxWithRole('viewer'))).toBe(false);
  });
});
