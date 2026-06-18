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
import { AdminUsersService } from '@/core/data/admin-users.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, MultiSelectModule, TagModule],
  template: `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2>Gestión de Usuarios</h2>
        <div class="flex gap-2">
          <button pButton label="Nuevo Rol" icon="pi pi-tags" (click)="rolDialog = true"></button>
          <button pButton label="Nuevo Usuario" icon="pi pi-user-plus" (click)="abrirNuevoUsuario()"></button>
        </div>
      </div>

      <p-table [value]="usuarios" [loading]="loading">
        <ng-template pTemplate="header">
          <tr><th>Usuario</th><th>Nombre</th><th>Email</th><th>Roles</th><th></th></tr>
        </ng-template>
        <ng-template pTemplate="body" let-u>
          <tr>
            <td>{{ u.username }}</td>
            <td>{{ u.persona?.firstName }} {{ u.persona?.lastName }}</td>
            <td>{{ u.persona?.email }}</td>
            <td><p-tag *ngFor="let r of u.roles" [value]="r.name" class="mr-1"></p-tag></td>
            <td><button pButton icon="pi pi-key" label="Roles" (click)="openAssign(u)"></button></td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Nuevo Rol -->
    <p-dialog header="Nuevo Rol" [(visible)]="rolDialog" [modal]="true">
      <div class="flex flex-col gap-2 p-2">
        <input pInputText placeholder="Nombre" [(ngModel)]="nuevoRol.name" />
        <input pInputText placeholder="Descripción" [(ngModel)]="nuevoRol.description" />
        <button pButton label="Crear" (click)="crearRol()"></button>
      </div>
    </p-dialog>

    <!-- Asignar Roles -->
    <p-dialog header="Asignar Roles" [(visible)]="assignDialog" [modal]="true">
      <div class="flex flex-col gap-2 p-2">
        <p-multiSelect
          [options]="roleOptions"
          [(ngModel)]="selectedRoleIds"
          optionLabel="name"
          optionValue="_id"
          placeholder="Seleccionar roles">
        </p-multiSelect>
        <button pButton label="Guardar" (click)="guardarRoles()"></button>
      </div>
    </p-dialog>

    <!-- Nuevo Usuario (crea persona + usuario en un solo paso) -->
    <p-dialog header="Nuevo Usuario" [(visible)]="nuevoUsuarioDialog" [modal]="true">
      <div class="flex flex-col gap-2 p-2">
        <input pInputText placeholder="Identificación" [(ngModel)]="nuevoUsuario.identification" />
        <input pInputText placeholder="Nombre" [(ngModel)]="nuevoUsuario.firstName" />
        <input pInputText placeholder="Apellido" [(ngModel)]="nuevoUsuario.lastName" />
        <input pInputText placeholder="Email" [(ngModel)]="nuevoUsuario.email" />
        <input pInputText placeholder="Teléfono (opcional)" [(ngModel)]="nuevoUsuario.phone" />
        <input pInputText placeholder="Nombre de usuario" [(ngModel)]="nuevoUsuario.username" />
        <input pInputText type="password" placeholder="Contraseña" [(ngModel)]="nuevoUsuario.password" />
        <p-multiSelect
          [options]="roleOptions"
          [(ngModel)]="nuevoUsuario.roleIds"
          optionLabel="name"
          optionValue="_id"
          placeholder="Asignar roles">
        </p-multiSelect>
        <button pButton label="Crear Usuario" (click)="crearNuevoUsuario()"></button>
      </div>
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

  nuevoRol = { name: '', description: '' };

  selectedRoleIds: string[] = [];
  roleOptions: any[] = [];
  assignTarget: any = null;

  nuevoUsuario = {
    identification: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    roleIds: [] as string[],
  };

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.admin.listUsuarios().subscribe({
      next: (u) => { this.usuarios = u; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.admin.listRoles().subscribe({
      next: (roles) => { this.roleOptions = roles; },
      error: () => {},
    });
  }

  crearRol() {
    this.admin.createRol(this.nuevoRol).subscribe({
      next: () => { this.rolDialog = false; this.nuevoRol = { name: '', description: '' }; this.cargar(); },
      error: () => {},
    });
  }

  openAssign(u: any) {
    this.assignTarget = u;
    this.selectedRoleIds = (u.roles ?? []).map((r: any) => r.id ?? r._id);
    this.assignDialog = true;
  }

  guardarRoles() {
    this.admin.assignRoles(this.assignTarget.id, this.selectedRoleIds).subscribe({
      next: () => { this.assignDialog = false; this.cargar(); },
      error: () => {},
    });
  }

  abrirNuevoUsuario() {
    this.nuevoUsuario = {
      identification: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      roleIds: [],
    };
    this.nuevoUsuarioDialog = true;
  }

  crearNuevoUsuario() {
    const { identification, firstName, lastName, email, phone, username, password, roleIds } = this.nuevoUsuario;
    this.admin.createPersona({ identification, firstName, lastName, email, phone }).subscribe({
      next: (persona: any) => {
        const personaId = persona._id ?? persona.id;
        this.admin.createUsuario({ personaId, username, password, roleIds }).subscribe({
          next: () => { this.nuevoUsuarioDialog = false; this.cargar(); },
          error: () => {},
        });
      },
      error: () => {},
    });
  }
}
