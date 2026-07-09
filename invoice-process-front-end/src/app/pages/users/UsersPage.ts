// src/app/pages/users/UsersPage.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { PasswordModule } from 'primeng/password';
import { AdminUsersService } from '@/core/data/admin-users.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, MultiSelectModule, TagModule, PasswordModule,
  ],
  styles: [`
    /* Badge de icono en gradiente — guiño al hero del dashboard. Único acento fuerte. */
    .gu-badge {
      width: 2.5rem; height: 2.5rem; border-radius: .75rem;
      display: inline-flex; align-items: center; justify-content: center;
      color: #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      box-shadow: 0 6px 16px -6px rgba(99,102,241,.6);
    }
    .gu-badge i { font-size: 1.15rem; }
    .gu-field label { display:block; font-size:.8rem; font-weight:600; margin-bottom:.4rem; }
    .gu-field :is(input, .p-password, .p-multiselect, .p-password input) { width: 100%; }
    .gu-section-label { font-size:.7rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; opacity:.55; }
    .gu-rolecell p-tag { margin-right:.35rem; }
  `],
  template: `
    <div class="card">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div class="flex items-center gap-3">
          <span class="gu-badge"><i class="pi pi-users"></i></span>
          <div>
            <h2 class="m-0 text-xl font-semibold">Gestión de Usuarios</h2>
            <p class="m-0 mt-0.5 text-sm" style="opacity:.6">Personas, cuentas de acceso y sus roles</p>
          </div>
        </div>
        <div class="flex gap-2">
          <p-button label="Nuevo Rol" icon="pi pi-tags" severity="secondary" [outlined]="true" (onClick)="abrirNuevoRol()"></p-button>
          <p-button label="Nuevo Usuario" icon="pi pi-user-plus" (onClick)="abrirNuevoUsuario()"></p-button>
        </div>
      </div>

      <!-- Tabla -->
      <p-table [value]="usuarios" [loading]="loading" [rows]="10" [paginator]="usuarios.length > 10" styleClass="p-datatable-sm" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Roles</th>
            <th style="width:8rem"></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-u>
          <tr>
            <td class="font-medium">{{ u.username }}</td>
            <td>{{ u.persona?.firstName }} {{ u.persona?.lastName }}</td>
            <td><span style="opacity:.75">{{ u.persona?.email }}</span></td>
            <td class="gu-rolecell">
              <p-tag *ngFor="let r of u.roles" [value]="r.name" [severity]="roleSeverity(r.name)" [rounded]="true"></p-tag>
              <span *ngIf="!u.roles?.length" style="opacity:.45; font-size:.85rem">— sin roles —</span>
            </td>
            <td>
              <p-button label="Roles" icon="pi pi-key" size="small" [text]="true" (onClick)="openAssign(u)"></p-button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="5" class="text-center py-8" style="opacity:.55">
            <i class="pi pi-inbox" style="font-size:1.6rem; display:block; margin-bottom:.5rem"></i>
            Aún no hay usuarios. Crea el primero con “Nuevo Usuario”.
          </td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- ───────────────── Nuevo Rol ───────────────── -->
    <p-dialog [(visible)]="rolDialog" [modal]="true" [draggable]="false" [dismissableMask]="true"
              [style]="{ width: '26rem' }" [breakpoints]="{ '640px': '92vw' }" [showHeader]="true">
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <span class="gu-badge"><i class="pi pi-tags"></i></span>
          <div>
            <div class="font-semibold">Nuevo Rol</div>
            <div class="text-sm" style="opacity:.6">Define un rol que podrás asignar a usuarios</div>
          </div>
        </div>
      </ng-template>

      <div class="flex flex-col gap-4 pt-2">
        <div class="gu-field">
          <label for="rolName">Nombre</label>
          <input id="rolName" pInputText [(ngModel)]="nuevoRol.name" placeholder="ej. auditor" autocomplete="off" />
        </div>
        <div class="gu-field">
          <label for="rolDesc">Descripción <span style="opacity:.5">(opcional)</span></label>
          <input id="rolDesc" pInputText [(ngModel)]="nuevoRol.description" placeholder="¿Qué puede hacer este rol?" autocomplete="off" />
        </div>
        <div class="gu-field">
          <label>Páginas que puede ver</label>
          <p-multiSelect [options]="pageOptions" [(ngModel)]="nuevoRol.permissions"
                         optionLabel="label" optionValue="key" display="chip" [filter]="true"
                         appendTo="body" placeholder="Selecciona las páginas" styleClass="w-full"
                         emptyMessage="No hay páginas disponibles.">
          </p-multiSelect>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="rolDialog = false"></p-button>
        <p-button label="Crear rol" icon="pi pi-check" [loading]="savingRol" [disabled]="!nuevoRol.name.trim()" (onClick)="crearRol()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- ───────────────── Editar páginas de un Rol ───────────────── -->
    <p-dialog [(visible)]="rolPermsDialog" [modal]="true" [draggable]="false" [dismissableMask]="true"
              [style]="{ width: '26rem' }" [breakpoints]="{ '640px': '92vw' }" [showHeader]="true">
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <span class="gu-badge"><i class="pi pi-sitemap"></i></span>
          <div>
            <div class="font-semibold">Editar páginas del rol</div>
            <div class="text-sm" style="opacity:.6">{{ rolTarget?.name }}</div>
          </div>
        </div>
      </ng-template>

      <div class="flex flex-col gap-4 pt-2">
        <div class="gu-field">
          <label>Páginas que puede ver</label>
          <p-multiSelect [options]="pageOptions" [(ngModel)]="selectedPages"
                         optionLabel="label" optionValue="key" display="chip" [filter]="true"
                         appendTo="body" placeholder="Selecciona las páginas" styleClass="w-full"
                         emptyMessage="No hay páginas disponibles.">
          </p-multiSelect>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="rolPermsDialog = false"></p-button>
        <p-button label="Guardar" icon="pi pi-check" [loading]="savingPerms" (onClick)="guardarPermisosRol()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- ───────────────── Roles ───────────────── -->
    <div class="card mt-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="m-0 text-lg font-semibold">Roles</h3>
          <p class="m-0 mt-0.5 text-sm" style="opacity:.6">Páginas visibles por cada rol</p>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <div *ngFor="let rol of roles" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3" style="border-bottom:1px solid rgba(128,128,128,.15)">
          <div class="flex items-start gap-3">
            <p-tag [value]="rol.name" [severity]="roleSeverity(rol.name)" [rounded]="true"></p-tag>
            <div>
              <div class="gu-rolecell">
                <p-tag *ngFor="let key of rol.permissions" [value]="pageLabel(key)" severity="secondary" [rounded]="true"></p-tag>
                <p-tag *ngIf="rol.name === 'admin'" value="Todas las páginas" severity="danger" [rounded]="true"></p-tag>
                <span *ngIf="rol.name !== 'admin' && !rol.permissions?.length" style="opacity:.45; font-size:.85rem">— sin páginas asignadas —</span>
              </div>
              <p class="m-0 mt-1 text-sm" style="opacity:.55" *ngIf="rol.description">{{ rol.description }}</p>
            </div>
          </div>
          <p-button *ngIf="rol.name !== 'admin'" label="Editar páginas" icon="pi pi-pencil" size="small" [text]="true" (onClick)="abrirEditarPermisos(rol)"></p-button>
          <span *ngIf="rol.name === 'admin'" class="text-sm" style="opacity:.5"><i class="pi pi-lock mr-1"></i>Rol bloqueado</span>
        </div>
        <div *ngIf="!roles.length" class="text-center py-8" style="opacity:.55">
          <i class="pi pi-inbox" style="font-size:1.6rem; display:block; margin-bottom:.5rem"></i>
          Aún no hay roles. Crea el primero con “Nuevo Rol”.
        </div>
      </div>
    </div>

    <!-- ───────────────── Asignar Roles ───────────────── -->
    <p-dialog [(visible)]="assignDialog" [modal]="true" [draggable]="false" [dismissableMask]="true"
              [style]="{ width: '28rem' }" [breakpoints]="{ '640px': '92vw' }">
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <span class="gu-badge"><i class="pi pi-key"></i></span>
          <div>
            <div class="font-semibold">Asignar Roles</div>
            <div class="text-sm" style="opacity:.6">{{ assignTarget?.persona?.firstName }} {{ assignTarget?.persona?.lastName }} · {{ assignTarget?.username }}</div>
          </div>
        </div>
      </ng-template>

      <div class="flex flex-col gap-3 pt-2">
        <div class="gu-field">
          <label>Roles del usuario</label>
          <p-multiSelect [options]="roleOptions" [(ngModel)]="selectedRoleIds"
                         optionLabel="name" optionValue="_id" display="chip" [filter]="true"
                         appendTo="body" placeholder="Selecciona uno o más roles" styleClass="w-full"
                         emptyMessage="No hay roles. Crea uno primero.">
          </p-multiSelect>
        </div>
        <p class="m-0 text-sm" style="opacity:.6">
          <i class="pi pi-info-circle mr-1"></i>
          Los permisos del usuario serán la <b>unión</b> de todos sus roles.
        </p>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="assignDialog = false"></p-button>
        <p-button label="Guardar" icon="pi pi-check" [loading]="savingAssign" [disabled]="!selectedRoleIds.length" (onClick)="guardarRoles()"></p-button>
      </ng-template>
    </p-dialog>

    <!-- ───────────────── Nuevo Usuario (persona + cuenta) ───────────────── -->
    <p-dialog [(visible)]="nuevoUsuarioDialog" [modal]="true" [draggable]="false" [dismissableMask]="true"
              [style]="{ width: '40rem' }" [breakpoints]="{ '768px': '94vw' }">
      <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
          <span class="gu-badge"><i class="pi pi-user-plus"></i></span>
          <div>
            <div class="font-semibold">Nuevo Usuario</div>
            <div class="text-sm" style="opacity:.6">Crea la persona y su cuenta de acceso</div>
          </div>
        </div>
      </ng-template>

      <div class="flex flex-col gap-5 pt-2">
        <!-- Datos de la persona -->
        <div>
          <div class="gu-section-label mb-3">Datos de la persona</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="gu-field">
              <label for="nuId">Identificación</label>
              <input id="nuId" pInputText [(ngModel)]="nuevoUsuario.identification" (input)="nuevoUsuario.identification = onlyDigits($event)"
                     pattern="\\d*" placeholder="Cédula / RUC" autocomplete="off" />
              <small class="text-red-500" *ngIf="nuevoUsuario.identification && !soloDigitos(nuevoUsuario.identification)">Solo números</small>
            </div>
            <div class="gu-field">
              <label for="nuEmail">Email</label>
              <input id="nuEmail" pInputText type="email" [(ngModel)]="nuevoUsuario.email" placeholder="correo@empresa.com" autocomplete="off" />
              <small class="text-red-500" *ngIf="nuevoUsuario.email && !emailValido(nuevoUsuario.email)">Email inválido</small>
            </div>
            <div class="gu-field">
              <label for="nuNombre">Nombres</label>
              <input id="nuNombre" pInputText [(ngModel)]="nuevoUsuario.firstName" placeholder="Nombres" autocomplete="off" />
            </div>
            <div class="gu-field">
              <label for="nuApellido">Apellidos</label>
              <input id="nuApellido" pInputText [(ngModel)]="nuevoUsuario.lastName" placeholder="Apellidos" autocomplete="off" />
            </div>
            <div class="gu-field sm:col-span-2">
              <label for="nuPhone">Teléfono <span style="opacity:.5">(opcional)</span></label>
              <input id="nuPhone" pInputText [(ngModel)]="nuevoUsuario.phone" (input)="nuevoUsuario.phone = onlyDigits($event)"
                     pattern="\\d*" placeholder="09xxxxxxxx" autocomplete="off" />
              <small class="text-red-500" *ngIf="nuevoUsuario.phone && !soloDigitos(nuevoUsuario.phone)">Solo números</small>
            </div>
          </div>
        </div>

        <!-- Cuenta de acceso -->
        <div>
          <div class="gu-section-label mb-3">Cuenta de acceso</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="gu-field">
              <label for="nuUser">Nombre de usuario</label>
              <input id="nuUser" pInputText [(ngModel)]="nuevoUsuario.username" placeholder="usuario" autocomplete="off" />
            </div>
            <div class="gu-field">
              <label for="nuPass">Contraseña</label>
              <p-password inputId="nuPass" [(ngModel)]="nuevoUsuario.password" [feedback]="false" [toggleMask]="true"
                          placeholder="••••••••" styleClass="w-full" inputStyleClass="w-full"></p-password>
              <small class="text-red-500" *ngIf="nuevoUsuario.password && nuevoUsuario.password.length < 6">Mínimo 6 caracteres</small>
            </div>
            <div class="gu-field sm:col-span-2">
              <label>Roles</label>
              <p-multiSelect [options]="roleOptions" [(ngModel)]="nuevoUsuario.roleIds"
                             optionLabel="name" optionValue="_id" display="chip" [filter]="true"
                             appendTo="body" placeholder="Asigna uno o más roles" styleClass="w-full"
                             emptyMessage="No hay roles. Crea uno primero."></p-multiSelect>
            </div>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="nuevoUsuarioDialog = false"></p-button>
        <p-button label="Crear usuario" icon="pi pi-check" [loading]="savingUsuario" [disabled]="!nuevoUsuarioValido" (onClick)="crearNuevoUsuario()"></p-button>
      </ng-template>
    </p-dialog>
  `,
})
export class UsersPage implements OnInit {
  private admin = inject(AdminUsersService);

  usuarios: any[] = [];
  loading = false;

  rolDialog = false;
  assignDialog = false;
  nuevoUsuarioDialog = false;
  rolPermsDialog = false;

  savingRol = false;
  savingAssign = false;
  savingUsuario = false;
  savingPerms = false;

  nuevoRol = { name: '', description: '', permissions: [] as string[] };

  selectedRoleIds: string[] = [];
  roleOptions: any[] = [];
  assignTarget: any = null;

  roles: any[] = [];
  pageOptions: { key: string; label: string }[] = [];
  rolTarget: any = null;
  selectedPages: string[] = [];

  nuevoUsuario = this.emptyUsuario();

  ngOnInit() { this.cargar(); }

  /** Valida que el formulario de nuevo usuario tenga los campos obligatorios y con formato correcto. */
  get nuevoUsuarioValido(): boolean {
    const u = this.nuevoUsuario;
    return !!(u.identification.trim() && this.soloDigitos(u.identification)
      && u.firstName.trim() && u.lastName.trim()
      && u.email.trim() && this.emailValido(u.email)
      && (!u.phone || this.soloDigitos(u.phone))
      && u.username.trim() && u.password && u.password.length >= 6
      && u.roleIds.length);
  }

  /** Extrae solo dígitos del valor de un input, para bloquear caracteres no numéricos. */
  onlyDigits(e: any): string {
    return (e?.target?.value || '').replace(/\D/g, '');
  }

  /** True si el valor contiene únicamente dígitos (y no está vacío). */
  soloDigitos(v: string): boolean {
    return /^\d+$/.test(v);
  }

  /** Valida un email con un patrón simple. */
  emailValido(v: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  }

  /** Color del tag según el rol, para distinguirlos de un vistazo. */
  roleSeverity(name: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (name) {
      case 'admin': return 'danger';
      case 'manager': return 'warn';
      case 'user': return 'info';
      case 'viewer': return 'secondary';
      default: return 'success';
    }
  }

  cargar() {
    this.loading = true;
    this.admin.listUsuarios().subscribe({
      next: (u) => { this.usuarios = u; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.admin.listRoles().subscribe({
      next: (roles) => { this.roleOptions = roles; this.roles = roles; },
      error: () => {},
    });
    this.admin.listPages().subscribe({
      next: (pages) => { this.pageOptions = pages; },
      error: () => {},
    });
  }

  /** Etiqueta legible de una página a partir de su key (fallback: la key misma). */
  pageLabel(key: string): string {
    return this.pageOptions.find((p) => p.key === key)?.label ?? key;
  }

  abrirNuevoRol() {
    this.nuevoRol = { name: '', description: '', permissions: [] };
    this.rolDialog = true;
  }

  crearRol() {
    this.savingRol = true;
    this.admin.createRol(this.nuevoRol).subscribe({
      next: () => { this.savingRol = false; this.rolDialog = false; this.cargar(); },
      error: () => { this.savingRol = false; },
    });
  }

  abrirEditarPermisos(rol: any) {
    this.rolTarget = rol;
    this.selectedPages = [...(rol.permissions || [])];
    this.rolPermsDialog = true;
  }

  guardarPermisosRol() {
    this.savingPerms = true;
    this.admin.updateRol(this.rolTarget._id, this.selectedPages).subscribe({
      next: () => { this.savingPerms = false; this.rolPermsDialog = false; this.cargar(); },
      error: () => { this.savingPerms = false; },
    });
  }

  openAssign(u: any) {
    this.assignTarget = u;
    this.selectedRoleIds = (u.roles ?? []).map((r: any) => r.id ?? r._id);
    this.assignDialog = true;
  }

  guardarRoles() {
    this.savingAssign = true;
    this.admin.assignRoles(this.assignTarget.id, this.selectedRoleIds).subscribe({
      next: () => { this.savingAssign = false; this.assignDialog = false; this.cargar(); },
      error: () => { this.savingAssign = false; },
    });
  }

  abrirNuevoUsuario() {
    this.nuevoUsuario = this.emptyUsuario();
    this.nuevoUsuarioDialog = true;
  }

  crearNuevoUsuario() {
    const { identification, firstName, lastName, email, phone, username, password, roleIds } = this.nuevoUsuario;
    this.savingUsuario = true;
    this.admin.createPersona({ identification, firstName, lastName, email, phone }).subscribe({
      next: (persona: any) => {
        const personaId = persona._id ?? persona.id;
        this.admin.createUsuario({ personaId, username, password, roleIds }).subscribe({
          next: () => { this.savingUsuario = false; this.nuevoUsuarioDialog = false; this.cargar(); },
          error: () => { this.savingUsuario = false; },
        });
      },
      error: () => { this.savingUsuario = false; },
    });
  }

  private emptyUsuario() {
    return {
      identification: '', firstName: '', lastName: '', email: '',
      phone: '', username: '', password: '', roleIds: [] as string[],
    };
  }
}
