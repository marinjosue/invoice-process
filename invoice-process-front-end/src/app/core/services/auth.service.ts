import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, AuthResponse, ChangePasswordRequest, LoginRequest, UpdateProfileRequest } from '../models/auth.model';
import { StorageService } from './storage.service';
import { TenantService } from './tenant.service';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$: Observable<string | null> = this.tokenSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private tenantService: TenantService
  ) {
    this.loadStoredAuth();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', request).pipe(
      tap(response => {
        if (response.success && response.token) {
          // Guardar token y usuario
          this.storageService.setToken(response.token);
          this.storageService.setUser(response.user);
          
          // Guardar información del tenant si está disponible
          if (response.user.tenantId) {
            this.tenantService.setTenant({
              id: response.user.tenantId,
              name: response.user.tenantName || '',
              subdomain: response.user.tenantSubdomain || ''
            });
          }
          
          // Actualizar observables
          this.userSubject.next(response.user);
          this.tokenSubject.next(response.token);
          this.isAuthenticatedSubject.next(true);
          
          console.log('Login exitoso:', {
            userId: response.user.id,
            email: response.user.email,
            tenantId: response.user.tenantId
          });
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  register(request: RegisterRequest): Observable<any> {
    return this.apiService.post<any>('/auth/register', request).pipe(
      catchError(error => {
        console.error('Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.apiService.post<any>('/auth/forgot-password', request).pipe(
      catchError(error => {
        console.error('Error en recuperación de contraseña:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(token: string, request: ResetPasswordRequest): Observable<any> {
    return this.apiService.put<any>(`/auth/reset-password/${token}`, request).pipe(
      catchError(error => {
        console.error('Error en restablecimiento de contraseña:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.storageService.clearAuth();
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.apiService.post('/auth/change-password', request);
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.apiService.put<User>('/auth/profile', request).pipe(
      tap(user => {
        this.storageService.setUser(user);
        this.userSubject.next(user);
      })
    );
  }

  updateUserData(userData: Partial<User>): void {
    const currentUser = this.userSubject.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      console.log('Actualizando datos del usuario:', updatedUser);
      this.storageService.setUser(updatedUser);
      this.userSubject.next(updatedUser);
    }
  }

  refreshUserData(): Observable<User> {
    return this.apiService.get<{ success: boolean; user: User }>('/profile').pipe(
      tap(response => {
        if (response.success && response.user) {
          console.log('Refrescando datos del usuario:', response.user);
          this.storageService.setUser(response.user);
          this.userSubject.next(response.user);
        }
      }),
      catchError(error => {
        console.error('Error refreshing user data:', error);
        return throwError(() => error);
      })
    ) as any;
  }

  isAuthenticatedValue(): boolean {
    return !!this.storageService.getToken();
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }

  private loadStoredAuth(): void {
    const token = this.storageService.getToken();
    const user = this.storageService.getUser();
    
    if (token) {
      this.tokenSubject.next(token);
      this.isAuthenticatedSubject.next(true);
    }

    if (user) {
      this.userSubject.next(user);
    }
  }
}
