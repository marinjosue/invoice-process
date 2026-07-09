// invoice-process-front-end/src/app/pages/users/UsersPage.spec.ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsersPage } from './UsersPage';
import { AdminUsersService } from '@/core/data/admin-users.service';

describe('UsersPage', () => {
  let admin: jasmine.SpyObj<AdminUsersService>;

  beforeEach(() => {
    admin = jasmine.createSpyObj('AdminUsersService', [
      'listUsuarios', 'listRoles', 'listPages',
      'createPersona', 'createUsuario', 'createRol', 'assignRoles', 'updateRol',
    ]);
    admin.listUsuarios.and.returnValue(of([]));
    admin.listRoles.and.returnValue(of([]));
    admin.listPages.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [{ provide: AdminUsersService, useValue: admin }],
    });
  });

  const build = () => {
    const fixture = TestBed.createComponent(UsersPage);
    return fixture.componentInstance;
    // No fixture.detectChanges(): evitamos ngOnInit()/cargar() y el render de plantilla PrimeNG.
  };

  it('form inválido (identificación con letras) deshabilita submit', () => {
    const comp = build();
    comp.nuevoUsuario = {
      identification: 'AB12', firstName: 'A', lastName: 'B', email: 'a@b.com',
      phone: '', username: 'u', password: 'secret1', roleIds: ['r1'],
    };
    expect(comp.nuevoUsuarioValido).toBeFalse();
  });

  it('form inválido (email malo) deshabilita submit', () => {
    const comp = build();
    comp.nuevoUsuario = {
      identification: '1712345678', firstName: 'A', lastName: 'B', email: 'bad-email',
      phone: '', username: 'u', password: 'secret1', roleIds: ['r1'],
    };
    expect(comp.nuevoUsuarioValido).toBeFalse();
  });

  it('form inválido (password corta) deshabilita submit', () => {
    const comp = build();
    comp.nuevoUsuario = {
      identification: '1712345678', firstName: 'A', lastName: 'B', email: 'a@b.com',
      phone: '', username: 'u', password: '123', roleIds: ['r1'],
    };
    expect(comp.nuevoUsuarioValido).toBeFalse();
  });

  it('form válido habilita submit', () => {
    const comp = build();
    comp.nuevoUsuario = {
      identification: '1712345678', firstName: 'A', lastName: 'B', email: 'a@b.com',
      phone: '0999999999', username: 'u', password: 'secret1', roleIds: ['r1'],
    };
    expect(comp.nuevoUsuarioValido).toBeTrue();
  });
});
