// src/app/core/data/admin-users.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AdminUsersService } from './admin-users.service';
import { ApiService } from '../services/api.service';
import { of } from 'rxjs';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [AdminUsersService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(AdminUsersService);
  });

  it('listUsuarios llama GET /admin/usuarios', () => {
    api.get.and.returnValue(of([]));
    service.listUsuarios().subscribe();
    expect(api.get).toHaveBeenCalledWith('/admin/usuarios');
  });

  it('assignRoles llama PUT /admin/usuarios/:id/roles', () => {
    api.put.and.returnValue(of({ success: true }));
    service.assignRoles('u1', ['r1', 'r2']).subscribe();
    expect(api.put).toHaveBeenCalledWith('/admin/usuarios/u1/roles', { roleIds: ['r1', 'r2'] });
  });

  it('createPersona llama POST /admin/personas', () => {
    api.post.and.returnValue(of({}));
    service.createPersona({ identification: '1', firstName: 'A', lastName: 'B', email: 'a@b.c' }).subscribe();
    expect(api.post).toHaveBeenCalledWith('/admin/personas', jasmine.any(Object));
  });
});
