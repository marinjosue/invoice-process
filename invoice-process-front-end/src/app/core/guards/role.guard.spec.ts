// invoice-process-front-end/src/app/core/guards/role.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  const auth = { getCurrentUser: jasmine.createSpy('getCurrentUser') } as any;
  const router = { navigate: jasmine.createSpy('navigate') } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    guard = TestBed.inject(RoleGuard);
    router.navigate.calls.reset();
  });

  const routeWith = (permission?: string) =>
    ({ data: permission ? { permission } : {} } as unknown as ActivatedRouteSnapshot);

  it('permite si la ruta no exige permiso', () => {
    auth.getCurrentUser.and.returnValue({ permissions: [] });
    expect(guard.canActivate(routeWith())).toBeTrue();
  });

  it('permite si el usuario tiene el permiso', () => {
    auth.getCurrentUser.and.returnValue({ permissions: ['settlements'] });
    expect(guard.canActivate(routeWith('settlements'))).toBeTrue();
  });

  it('redirige a /dashboard si no tiene el permiso', () => {
    auth.getCurrentUser.and.returnValue({ permissions: ['dashboard'] });
    expect(guard.canActivate(routeWith('settlements'))).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
