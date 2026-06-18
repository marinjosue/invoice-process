import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const token = storageService.getToken();
  
  console.log('[AuthInterceptor] Token encontrado:', token ? 'SI' : 'NO');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('[AuthInterceptor] Request con Authorization header:', req.headers.get('Authorization')?.substring(0, 20) + '...');
  } else {
    console.warn('[AuthInterceptor] No hay token - la peticion NO esta autenticada');
  }

  return next(req);
};
