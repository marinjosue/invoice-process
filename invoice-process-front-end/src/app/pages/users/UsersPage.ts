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
          <button pButton label="Nueva Persona" icon="pi pi-user-plus" (click)="personaDialog = true"></button>
          <button pButton label="Nuevo Usuario" icon="pi pi-users" (click)="usuarioDialog = true"></button>
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

    <p-dialog header="Nuevo Rol" [(visible)]="rolDialog" [modal]="true">
      <input pInputText placeholder="Nombre" [(ngModel)]="nuevoRol.name" />
      <input pInputText placeholder="Descripción" [(ngModel)]="nuevoRol.description" />
      <button pButton label="Crear" (click)="crearRol()"></button>
    </p-dialog>

    <p-dialog header="Asignar Roles" [(visible)]="assignDialog" [modal]="true">
      <p-multiSelect [options]="roleOptions" [(ngModel)]="selectedRoleIds" optionLabel="name" optionValue="id"></p-multiSelect>
      <button pButton label="Guardar" (click)="guardarRoles()"></button>
    </p-dialog>
  `,
})
export class UsersPage implements OnInit {
  private admin = inject(AdminUsersService);
  usuarios: any[] = [];
  loading = false;
  rolDialog = false;
  personaDialog = false;
  usuarioDialog = false;
  assignDialog = false;
  nuevoRol = { name: '', description: '' };
  selectedRoleIds: string[] = [];
  roleOptions: { id: string; name: string }[] = [];
  assignTarget: any = null;

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.admin.listUsuarios().subscribe({
      next: (u) => { this.usuarios = u; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  crearRol() {
    this.admin.createRol(this.nuevoRol).subscribe(() => { this.rolDialog = false; this.nuevoRol = { name: '', description: '' }; });
  }

  openAssign(u: any) {
    this.assignTarget = u;
    this.selectedRoleIds = (u.roles ?? []).map((r: any) => r.id);
    this.assignDialog = true;
  }

  guardarRoles() {
    this.admin.assignRoles(this.assignTarget.id, this.selectedRoleIds).subscribe(() => {
      this.assignDialog = false;
      this.cargar();
    });
  }
}
