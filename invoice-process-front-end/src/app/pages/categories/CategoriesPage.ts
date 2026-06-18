import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CategoryApiService } from '@/core/data/category-api.service';
import { NotificationService } from '@/shared/services/notification.service';
import { Category } from '../../../types/category.types';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    TagModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Categorías de Productos</h2>
        <p-button label="Nueva Categoría" icon="pi pi-plus" (onClick)="createCategory()" />
      </div>

      <p-table [value]="categories()" [loading]="isLoading()" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-category>
          <tr>
            <td>{{ category.code || '-' }}</td>
            <td><strong>{{ category.name }}</strong></td>
            <td>{{ category.description || '-' }}</td>
            <td>
              <p-tag 
                [value]="category.isActive ? 'Activo' : 'Inactivo'" 
                [severity]="category.isActive ? 'success' : 'secondary'" />
            </td>
            <td>
              <p-button 
                icon="pi pi-pencil" 
                [text]="true" 
                (onClick)="editCategory(category._id!)" 
                pTooltip="Editar" />
              <p-button 
                icon="pi pi-trash" 
                [text]="true" 
                severity="danger" 
                (onClick)="deleteCategory(category)" 
                pTooltip="Eliminar" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" class="text-center">No hay categorías registradas</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Dialog para crear/editar categoría -->
    <p-dialog 
      [header]="isEditMode ? 'Editar Categoría' : 'Nueva Categoría'"
      [(visible)]="showDialog"
      [modal]="true"
      [style]="{width: '500px'}"
      (onHide)="closeDialog()">
      <form [formGroup]="categoryForm">
        <div class="flex flex-col gap-4">
          <div class="field">
            <label for="name" class="font-semibold">Nombre *</label>
            <input
              pInputText
              id="name"
              formControlName="name"
              placeholder="Ej: Electrónica, Ferretería, etc."
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="code" class="font-semibold">Código</label>
            <input
              pInputText
              id="code"
              formControlName="code"
              placeholder="Ej: ELEC, FERR, etc."
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="description" class="font-semibold">Descripción</label>
            <textarea
              pInputText
              id="description"
              formControlName="description"
              rows="3"
              placeholder="Descripción opcional"
              [style]="{'width': '100%'}"></textarea>
          </div>

          <div class="field">
            <p-checkbox 
              formControlName="isActive" 
              [binary]="true" 
              label="Categoría activa" />
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" (onClick)="closeDialog()" />
        <p-button 
          [label]="isEditMode ? 'Actualizar' : 'Crear'"
          [loading]="isSaving"
          (onClick)="saveCategory()"
          [disabled]="!categoryForm.valid" />
      </ng-template>
    </p-dialog>

    <p-confirmDialog />
  `
})
export class CategoriesPage implements OnInit {
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  showDialog = false;
  isEditMode = false;
  isSaving = false;
  currentCategoryId: string | null = null;
  categoryForm: FormGroup;

  constructor(
    private categoryApiService: CategoryApiService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryApiService.list().subscribe({
      next: (response) => {
        this.categories.set(response.categories || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar las categorías');
        this.isLoading.set(false);
      }
    });
  }

  createCategory(): void {
    this.isEditMode = false;
    this.currentCategoryId = null;
    this.categoryForm.reset({
      name: '',
      code: '',
      description: '',
      isActive: true
    });
    this.showDialog = true;
  }

  editCategory(id: string): void {
    this.isEditMode = true;
    this.currentCategoryId = id;
    this.categoryApiService.getById(id).subscribe({
      next: (response) => {
        this.categoryForm.patchValue(response.category);
        this.showDialog = true;
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo cargar la categoría');
      }
    });
  }

  saveCategory(): void {
    if (!this.categoryForm.valid) return;

    this.isSaving = true;
    const formData = this.categoryForm.value;

    const request$ = this.isEditMode && this.currentCategoryId
      ? this.categoryApiService.update(this.currentCategoryId, formData)
      : this.categoryApiService.create(formData);

    request$.subscribe({
      next: () => {
        this.notificationService.success(
          'Éxito', 
          this.isEditMode ? 'Categoría actualizada' : 'Categoría creada'
        );
        this.closeDialog();
        this.loadCategories();
        this.isSaving = false;
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'No se pudo guardar la categoría';
        this.notificationService.error('Error', errorMsg);
        this.isSaving = false;
      }
    });
  }

  deleteCategory(category: Category): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la categoría "${category.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.categoryApiService.delete(category._id!).subscribe({
          next: () => {
            this.notificationService.success('Éxito', 'Categoría eliminada');
            this.loadCategories();
          },
          error: () => {
            this.notificationService.error('Error', 'No se pudo eliminar la categoría');
          }
        });
      }
    });
  }

  closeDialog(): void {
    this.showDialog = false;
    this.isEditMode = false;
    this.currentCategoryId = null;
    this.categoryForm.reset({
      name: '',
      code: '',
      description: '',
      isActive: true
    });
  }
}
