// src/app/core/data/admin-users.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  constructor(private api: ApiService) {}

  listUsuarios(): Observable<any[]> {
    return this.api.get<any[]>('/admin/usuarios');
  }
  listRoles(): Observable<any[]> {
    return this.api.get<any[]>('/admin/roles');
  }
  createPersona(data: { identification: string; firstName: string; lastName: string; email: string; phone?: string }): Observable<any> {
    return this.api.post('/admin/personas', data);
  }
  createUsuario(data: { personaId: string; username: string; password: string; roleIds: string[] }): Observable<any> {
    return this.api.post('/admin/usuarios', data);
  }
  createRol(data: { name: string; description?: string; permissions: string[] }): Observable<any> {
    return this.api.post('/admin/roles', data);
  }
  assignRoles(usuarioId: string, roleIds: string[]): Observable<any> {
    return this.api.put(`/admin/usuarios/${usuarioId}/roles`, { roleIds });
  }
  listPages(): Observable<any[]> {
    return this.api.get<any[]>('/admin/pages');
  }
  updateRol(id: string, permissions: string[]): Observable<any> {
    return this.api.put(`/admin/roles/${id}`, { permissions });
  }
}
