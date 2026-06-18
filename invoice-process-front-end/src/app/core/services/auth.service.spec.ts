import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { TenantService } from './tenant.service';
import { AuthResponse, User } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let api: jasmine.SpyObj<ApiService>;
  let storage: jasmine.SpyObj<StorageService>;
  let tenant: jasmine.SpyObj<TenantService>;

  const user: User = {
    id: 'u-1',
    email: 'demo@espe.edu.ec',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'admin',
    tenantId: 't-1',
    tenantName: 'ESPE',
    tenantSubdomain: 'espe',
  };

  const authResponse: AuthResponse = { success: true, token: 'jwt.token.123', user };

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    storage = jasmine.createSpyObj('StorageService', [
      'setToken',
      'setUser',
      'getToken',
      'getUser',
      'clearAuth',
    ]);
    tenant = jasmine.createSpyObj('TenantService', ['setTenant']);

    // Por defecto: sin sesión almacenada (loadStoredAuth en el constructor)
    storage.getToken.and.returnValue(null);
    storage.getUser.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: api },
        { provide: StorageService, useValue: storage },
        { provide: TenantService, useValue: tenant },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('persiste token/usuario y emite autenticado en login exitoso', (done) => {
      api.post.and.returnValue(of(authResponse));

      service.login({ email: user.email, password: 'secret' }).subscribe((res) => {
        expect(res).toEqual(authResponse);
        expect(storage.setToken).toHaveBeenCalledWith('jwt.token.123');
        expect(storage.setUser).toHaveBeenCalledWith(user);
        expect(tenant.setTenant).toHaveBeenCalledWith(
          jasmine.objectContaining({ id: 't-1', name: 'ESPE', subdomain: 'espe' }),
        );
        expect(service.getCurrentUser()).toEqual(user);
        service.isAuthenticated$.subscribe((v) => expect(v).toBeTrue());
        done();
      });
    });

    it('NO persiste si la respuesta no es exitosa', (done) => {
      api.post.and.returnValue(of({ success: false, token: '', user } as AuthResponse));

      service.login({ email: user.email, password: 'bad' }).subscribe(() => {
        expect(storage.setToken).not.toHaveBeenCalled();
        expect(service.getCurrentUser()).toBeNull();
        done();
      });
    });

    it('hace logout y propaga el error cuando el login falla', (done) => {
      api.post.and.returnValue(throwError(() => new Error('401')));

      service.login({ email: user.email, password: 'bad' }).subscribe({
        error: () => {
          expect(storage.clearAuth).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('logout', () => {
    it('limpia almacenamiento y estado', (done) => {
      service.logout();
      expect(storage.clearAuth).toHaveBeenCalled();
      service.isAuthenticated$.subscribe((v) => {
        expect(v).toBeFalse();
        done();
      });
    });
  });

  describe('isAuthenticatedValue', () => {
    it('es true cuando existe token en storage', () => {
      storage.getToken.and.returnValue('jwt.token.123');
      expect(service.isAuthenticatedValue()).toBeTrue();
    });

    it('es false cuando no hay token', () => {
      storage.getToken.and.returnValue(null);
      expect(service.isAuthenticatedValue()).toBeFalse();
    });
  });

  describe('updateUserData', () => {
    it('fusiona y persiste los datos del usuario actual', (done) => {
      api.post.and.returnValue(of(authResponse));
      service.login({ email: user.email, password: 'secret' }).subscribe(() => {
        storage.setUser.calls.reset();

        service.updateUserData({ firstName: 'Grace' });

        expect(storage.setUser).toHaveBeenCalledWith(
          jasmine.objectContaining({ firstName: 'Grace', email: user.email }),
        );
        expect(service.getCurrentUser()?.firstName).toBe('Grace');
        done();
      });
    });

    it('no hace nada si no hay usuario actual', () => {
      service.updateUserData({ firstName: 'X' });
      expect(storage.setUser).not.toHaveBeenCalled();
    });
  });
});
