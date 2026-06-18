import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { User } from '../models/auth.model';
import { Tenant } from '../models/tenant.model';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StorageService] });
    service = TestBed.inject(StorageService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  describe('token', () => {
    it('guarda y recupera el token', () => {
      service.setToken('abc.123.xyz');
      expect(service.getToken()).toBe('abc.123.xyz');
    });

    it('no guarda un token vacío', () => {
      service.setToken('');
      expect(service.getToken()).toBeNull();
    });

    it('devuelve null si no hay token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('usuario', () => {
    const user: User = {
      id: 'u-1',
      email: 'demo@espe.edu.ec',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'admin',
      tenantId: 't-1',
    };

    it('serializa y deserializa el usuario', () => {
      service.setUser(user);
      expect(service.getUser()).toEqual(user);
    });

    it('devuelve null cuando no hay usuario', () => {
      expect(service.getUser()).toBeNull();
    });
  });

  describe('tenant', () => {
    it('serializa y deserializa el tenant', () => {
      const tenant: Tenant = { id: 't-1', name: 'ESPE', subdomain: 'espe' };
      service.setTenant(tenant);
      expect(service.getTenant()).toEqual(tenant);
    });
  });

  describe('clearAuth', () => {
    it('borra token, refresh y usuario pero conserva otros datos', () => {
      service.setToken('t');
      service.setRefreshToken('r');
      service.setUser({
        id: 'u-1',
        email: 'a@b.c',
        firstName: 'A',
        lastName: 'B',
        role: 'user',
        tenantId: 't-1',
      });
      service.setSettings({ theme: 'dark' });

      service.clearAuth();

      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.getUser()).toBeNull();
      // clearAuth NO debe borrar las preferencias de la app
      expect(service.getSettings()).toEqual({ theme: 'dark' });
    });
  });

  describe('clear', () => {
    it('borra absolutamente todo', () => {
      service.setToken('t');
      service.setSettings({ theme: 'dark' });
      service.clear();
      expect(service.getToken()).toBeNull();
      expect(service.getSettings()).toBeNull();
    });
  });
});
