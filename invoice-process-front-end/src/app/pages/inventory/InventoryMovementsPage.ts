import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InventoryMovementApiService } from '@/core/data/inventory-movement-api.service';
import { NotificationService } from '@/shared/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InventoryMovement, MovementType } from '../../../types/inventory.types';

@Component({
  selector: 'app-inventory-movements-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    InputTextModule,
    TagModule,
    TooltipModule
  ],
  template: `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-2xl font-bold">Movimientos de Inventario</h2>
          <p class="text-sm text-gray-500 mt-1">
            💡 Las entradas (ENTRY) se crean automáticamente al finalizar liquidaciones
          </p>
        </div>
        <p-button 
          label="Nueva Salida/Ajuste" 
          icon="pi pi-plus" 
          (onClick)="createMovement()"
          pTooltip="Crear salida de inventario o ajuste manual" />
      </div>

      <!-- Filtros -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="field">
          <label for="filterProduct">Producto</label>
          <p-select
            id="filterProduct"
            [(ngModel)]="selectedProductFilter"
            [options]="availableProducts()"
            optionLabel="description"
            optionValue="_id"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="applyFilters()"
            [style]="{'width': '100%'}" />
        </div>
        
        <div class="field">
          <label for="filterType">Tipo</label>
          <p-select
            id="filterType"
            [(ngModel)]="selectedTypeFilter"
            [options]="filterTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="applyFilters()"
            [style]="{'width': '100%'}" />
        </div>
      </div>

      <p-table [value]="movements()" [loading]="isLoading()" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Stock Anterior</th>
            <th>Stock Nuevo</th>
            <th>Razón</th>
            <th>Usuario</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-movement>
          <tr>
            <td>{{ movement.movementDate | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>
              <div *ngIf="movement.productId && movement.productId.sku">
                <strong>{{ movement.productId.sku }}</strong><br>
                <small>{{ movement.productId.description }}</small>
              </div>
            </td>
            <td>
              <p-tag [value]="getTypeLabel(movement.type)" [severity]="getTypeSeverity(movement.type)" />
            </td>
            <td>{{ movement.quantity }}</td>
            <td>{{ movement.previousStock }}</td>
            <td>{{ movement.newStock }}</td>
            <td>{{ movement.reason }}</td>
            <td>
              <span *ngIf="movement.userId && movement.userId.username">
                {{ movement.userId.username }}
              </span>
            </td>
            <td>
              <p-button 
                icon="pi pi-pencil" 
                [text]="true" 
                (onClick)="editMovement(movement._id!)" 
                pTooltip="Editar notas" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center">No hay movimientos registrados</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Dialog para crear movimiento -->
    <p-dialog 
      [header]="isEditMode ? 'Editar Movimiento' : 'Nuevo Movimiento de Inventario'"
      [(visible)]="showDialog"
      [modal]="true"
      [style]="{width: '600px'}"
      (onHide)="closeDialog()">
      <form [formGroup]="movementForm">
        <div class="flex flex-col gap-4">
          <!-- Producto -->
          <div class="field" *ngIf="!isEditMode">
            <label for="product" class="font-semibold">Producto *</label>
            <p-select
              id="product"
              formControlName="productId"
              [options]="availableProducts()"
              optionLabel="description"
              optionValue="_id"
              placeholder="Seleccionar producto"
              [filter]="true"
              filterBy="sku,description"
              [style]="{'width': '100%'}">
              <ng-template let-product pTemplate="item">
                <div class="flex flex-col">
                  <span class="font-semibold">{{ product.sku }}</span>
                  <span class="text-sm text-gray-600">{{ product.description }}</span>
                  <span class="text-xs text-gray-500">Stock actual: {{ product.currentStock }} {{ product.unit }}</span>
                </div>
              </ng-template>
            </p-select>
          </div>

          <!-- Tipo de Movimiento -->
          <div class="field" *ngIf="!isEditMode">
            <label for="type" class="font-semibold">Tipo de Movimiento *</label>
            <p-select
              id="type"
              formControlName="type"
              [options]="movementTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              [style]="{'width': '100%'}">
              <ng-template let-type pTemplate="selectedItem">
                <p-tag [value]="type.label" [severity]="type.severity" />
              </ng-template>
              <ng-template let-type pTemplate="item">
                <p-tag [value]="type.label" [severity]="type.severity" />
              </ng-template>
            </p-select>
            <small class="text-gray-500 block mt-1">
              🔒 Las entradas (ENTRY) solo se crean desde liquidaciones finalizadas
            </small>
          </div>

          <!-- Cantidad -->
          <div class="field" *ngIf="!isEditMode">
            <label for="quantity" class="font-semibold">Cantidad *</label>
            <p-inputNumber
              id="quantity"
              formControlName="quantity"
              [min]="1"
              [showButtons]="true"
              [style]="{'width': '100%'}" />
            <small class="text-gray-500" *ngIf="movementForm.get('type')?.value === 'ADJUSTMENT'">
              En ajuste, ingrese el nuevo stock total deseado
            </small>
          </div>

          <!-- Razón -->
          <div class="field">
            <label for="reason" class="font-semibold">Razón *</label>
            <input
              pInputText
              id="reason"
              formControlName="reason"
              placeholder="Ej: Compra a proveedor, Venta, Corrección de inventario"
              [style]="{'width': '100%'}" />
          </div>

          <!-- Notas -->
          <div class="field">
            <label for="notes" class="font-semibold">Notas</label>
            <textarea
              pInputTextarea
              id="notes"
              formControlName="notes"
              rows="3"
              placeholder="Notas adicionales opcionales"
              [style]="{'width': '100%'}"></textarea>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" (onClick)="closeDialog()" />
        <p-button 
          [label]="isEditMode ? 'Actualizar' : 'Crear'"
          [loading]="isSaving"
          (onClick)="saveMovement()"
          [disabled]="!movementForm.valid" />
      </ng-template>
    </p-dialog>
  `
})
export class InventoryMovementsPage implements OnInit {
  movements = signal<InventoryMovement[]>([]);
  availableProducts = signal<any[]>([]);
  isLoading = signal(false);
  showDialog = false;
  isEditMode = false;
  isSaving = false;
  currentMovementId: string | null = null;
  movementForm: FormGroup;

  selectedProductFilter: string | null = null;
  selectedTypeFilter: MovementType | null = null;

  // Tipos disponibles para filtrado (incluye todos)
  filterTypeOptions = [
    { label: 'ENTRADA', value: MovementType.ENTRY, severity: 'success' },
    { label: 'SALIDA', value: MovementType.EXIT, severity: 'danger' },
    { label: 'AJUSTE', value: MovementType.ADJUSTMENT, severity: 'warn' }
  ];

  // Tipos disponibles para creación manual (NO incluye ENTRY)
  // 🔒 ENTRY solo puede crearse desde liquidaciones finalizadas
  movementTypeOptions = [
    { label: 'SALIDA', value: MovementType.EXIT, severity: 'danger' },
    { label: 'AJUSTE', value: MovementType.ADJUSTMENT, severity: 'warn' }
  ];

  constructor(
    private inventoryMovementApiService: InventoryMovementApiService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.movementForm = this.fb.group({
      productId: ['', Validators.required],
      type: [MovementType.ENTRY, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadMovements();
    this.loadAvailableProducts();
  }

  loadMovements(): void {
    this.isLoading.set(true);
    const filters: any = {};
    if (this.selectedProductFilter) filters.productId = this.selectedProductFilter;
    if (this.selectedTypeFilter) filters.type = this.selectedTypeFilter;

    this.inventoryMovementApiService.list(filters).subscribe({
      next: (response) => {
        this.movements.set(response.movements || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar los movimientos');
        this.isLoading.set(false);
      }
    });
  }

  loadAvailableProducts(): void {
    this.http.get<any>(`${environment.apiUrl}/products`).subscribe({
      next: (response) => {
        this.availableProducts.set(response.products || []);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar los productos');
      }
    });
  }

  applyFilters(): void {
    this.loadMovements();
  }

  createMovement(): void {
    this.isEditMode = false;
    this.currentMovementId = null;
    this.movementForm.reset({
      productId: '',
      type: MovementType.EXIT, // Por defecto EXIT (no ENTRY)
      quantity: 1,
      reason: '',
      notes: ''
    });
    this.showDialog = true;
  }

  editMovement(id: string): void {
    this.isEditMode = true;
    this.currentMovementId = id;
    this.http.get<any>(`${environment.apiUrl}/inventory-movements/${id}`).subscribe({
      next: (response) => {
        const movement = response.movement;
        this.movementForm.patchValue({
          reason: movement.reason || '',
          notes: movement.notes || ''
        });
        this.showDialog = true;
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo cargar el movimiento');
      }
    });
  }

  saveMovement(): void {
    if (!this.movementForm.valid) return;

    this.isSaving = true;
    const formData = this.movementForm.value;

    const request$ = this.isEditMode && this.currentMovementId
      ? this.inventoryMovementApiService.update(this.currentMovementId, {
          reason: formData.reason,
          notes: formData.notes
        })
      : this.inventoryMovementApiService.create(formData);

    request$.subscribe({
      next: () => {
        this.notificationService.success(
          'Éxito', 
          this.isEditMode ? 'Movimiento actualizado' : 'Movimiento creado y stock actualizado'
        );
        this.closeDialog();
        this.loadMovements();
        this.loadAvailableProducts(); // Recargar para ver stock actualizado
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error al guardar movimiento:', error);
        const errorMsg = error.error?.message || 'No se pudo guardar el movimiento';
        this.notificationService.error('Error', errorMsg);
        this.isSaving = false;
      }
    });
  }

  closeDialog(): void {
    this.showDialog = false;
    this.isEditMode = false;
    this.currentMovementId = null;
    this.movementForm.reset({
      productId: '',
      type: MovementType.EXIT, // Por defecto EXIT (no ENTRY)
      quantity: 1,
      reason: '',
      notes: ''
    });
  }

  getTypeLabel(type: string): string {
    const option = this.movementTypeOptions.find(opt => opt.value === type);
    return option?.label || type;
  }

  getTypeSeverity(type: string): 'success' | 'danger' | 'warn' | 'info' {
    const option = this.filterTypeOptions.find(opt => opt.value === type);
    return option?.severity as any || 'info';
  }
}
