import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

export interface Supplier {
  _id: string;
  supplierId: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  invoiceCount?: number;
  totalPurchases?: number;
  createdAt?: Date;
}

@Component({
  selector: 'app-provider-list-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule
  ],
  template: `
    <!-- Search -->
    <div class="mb-4">
      <p-iconfield iconPosition="left">
        <p-inputicon styleClass="pi pi-search" />
        <input 
          pInputText 
          type="text" 
          placeholder="Buscar por nombre, ID o NIT..."
          [(ngModel)]="searchValue"
          (input)="onSearchChange()"
          class="w-full"
        />
      </p-iconfield>
    </div>

    <p-table 
      [value]="suppliers" 
      [loading]="isLoading" 
      responsiveLayout="scroll"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="header">
        <tr>
          <th style="width: 15%">ID Proveedor</th>
          <th style="width: 20%">Nombre</th>
          <th style="width: 15%">NIT/RUC</th>
          <th style="width: 15%">Email</th>
          <th style="width: 12%">Teléfono</th>
          <th style="width: 10%">Estado</th>
          <th style="width: 13%">Acciones</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-supplier>
        <tr>
          <td>
            <span class="text-sm font-mono">{{ supplier.supplierId }}</span>
          </td>
          <td>
            <div class="font-medium">{{ supplier.name }}</div>
            @if (supplier.city || supplier.country) {
              <div class="text-sm text-gray-500">
                {{ supplier.city }}@if (supplier.city && supplier.country) {, }{{ supplier.country }}
              </div>
            }
          </td>
          <td>{{ supplier.taxId || '-' }}</td>
          <td>{{ supplier.email || '-' }}</td>
          <td>{{ supplier.phone || '-' }}</td>
          <td>
            <p-tag 
              [value]="supplier.isActive ? 'Activo' : 'Inactivo'" 
              [severity]="supplier.isActive ? 'success' : 'danger'"
            />
          </td>
          <td>
            <div class="flex gap-2">
              <p-button 
                icon="pi pi-pencil"
                [text]="true" 
                severity="secondary" 
                [rounded]="true"
                size="small"
                pTooltip="Editar"
                tooltipPosition="top"
                (onClick)="onEdit(supplier._id)" 
              />
              <p-button 
                icon="pi pi-trash"
                [text]="true" 
                severity="danger" 
                [rounded]="true"
                size="small"
                pTooltip="Eliminar"
                tooltipPosition="top"
                (onClick)="onDelete(supplier)" 
              />
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="7" class="text-center py-4">
            @if (searchValue) {
              <div class="text-gray-500">
                <i class="pi pi-search text-2xl mb-2"></i>
                <p>No se encontraron proveedores con "{{ searchValue }}"</p>
              </div>
            } @else {
              <div class="text-gray-500">
                <i class="pi pi-inbox text-2xl mb-2"></i>
                <p>No hay proveedores registrados</p>
              </div>
            }
          </td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class ProviderListTableComponent {
  @Input() suppliers: Supplier[] = [];
  @Input() isLoading = false;
  @Input() searchValue = '';
  
  @Output() searchValueChange = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<Supplier>();

  onSearchChange(): void {
    this.searchValueChange.emit(this.searchValue);
  }

  onEdit(id: string): void {
    this.edit.emit(id);
  }

  onDelete(supplier: Supplier): void {
    this.delete.emit(supplier);
  }
}
