import { Injectable } from '@angular/core';
import { User } from '../models/auth.model';
import { Tenant } from '../models/tenant.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TENANT_KEY = 'current_tenant';
  private readonly USER_KEY = 'current_user';
  private readonly SETTINGS_KEY = 'app_settings';

  setToken(token: string): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    if (token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTenant(tenant: Tenant): void {
    localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));
  }

  getTenant(): Tenant | null {
    const tenant = localStorage.getItem(this.TENANT_KEY);
    return tenant ? JSON.parse(tenant) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  setSettings(settings: any): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  getSettings(): any {
    const settings = localStorage.getItem(this.SETTINGS_KEY);
    return settings ? JSON.parse(settings) : null;
  }

  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  clear(): void {
    localStorage.clear();
  }
}
