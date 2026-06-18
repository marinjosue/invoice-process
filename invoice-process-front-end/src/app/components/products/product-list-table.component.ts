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

export interface Product {
  _id?: string;
  sku: string;
  description: string;
  unit?: string;
  categoryId?: string;
  estimatedCost?: number;
  currentStock?: number;
  minStock?: number;
  warehouseLocation?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-product-list-table',
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
          placeholder="Buscar por SKU o descripción..."
          [(ngModel)]="searchValue"
          (input)="onSearchChange()"
          class="w-full"
        />
      </p-iconfield>
    </div>

    <p-table 
      [value]="products" 
      [loading]="isLoading" 
      responsiveLayout="scroll"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="header">
        <tr>
          <th style="width: 15%">SKU</th>
          <th style="width: 35%">Descripción</th>
          <th style="width: 12%">Unidad</th>
          <th style="width: 13%">Costo Est.</th>
          <th style="width: 10%" class="text-center">Stock</th>
          <th style="width: 15%" class="text-center">Acciones</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-product>
        <tr>
          <td>
            <span class="font-mono text-sm font-semibold">{{ product.sku }}</span>
          </td>
          <td>{{ product.description }}</td>
          <td>{{ product.unit || 'Unidad' }}</td>
          <td>{{ product.estimatedCost | currency:'USD':'symbol':'1.2-2' }}</td>
          <td class="text-center">
            <p-tag 
              [value]="product.currentStock?.toString() || '0'"
              [severity]="getStockSeverity(product.currentStock, product.minStock)"
            />
          </td>
          <td class="text-center">
            <p-button 
              icon="pi pi-pencil" 
              [text]="true" 
              severity="secondary" 
              size="small"
              pTooltip="Editar"
              tooltipPosition="top"
              (onClick)="onEdit(product._id!)" 
            />
            <p-button 
              icon="pi pi-trash" 
              [text]="true" 
              severity="danger" 
              size="small"
              pTooltip="Eliminar"
              tooltipPosition="top"
              (onClick)="onDelete(product._id!)" 
            />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="6" class="text-center p-4 text-surface-500">
            @if (searchValue) {
              <span>No se encontraron productos con "{{ searchValue }}"</span>
            } @else {
              <span>No hay productos registrados</span>
            }
          </td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class ProductListTableComponent {
  @Input() products: Product[] = [];
  @Input() isLoading = false;
  @Input() searchValue = '';
  
  @Output() searchValueChange = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onSearchChange(): void {
    this.searchValueChange.emit(this.searchValue);
  }

  onEdit(id: string): void {
    this.edit.emit(id);
  }

  onDelete(id: string): void {
    this.delete.emit(id);
  }

  getStockSeverity(currentStock: number, minStock: number): 'success' | 'warn' | 'danger' {
    if (!currentStock) return 'danger';
    if (currentStock <= minStock) return 'warn';
    return 'success';
  }
}
