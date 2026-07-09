import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

export interface ProductFormData {
  sku: string;
  description: string;
  unit?: string;
  categoryId?: string;
  estimatedCost?: number;
  currentStock?: number;
  minStock?: number;
  warehouseLocation?: string;
  isActive: boolean;
}

export interface Category {
  _id?: string;
  name: string;
}

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    SelectModule
  ],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [header]="isEditMode ? 'Editar Producto' : 'Nuevo Producto'"
      [modal]="true"
      [style]="{width: '700px'}"
      [draggable]="false"
      [resizable]="false"
      (onHide)="onDialogHide()"
    >
      <form [formGroup]="productForm" class="grid grid-cols-2 gap-4 mt-4">
        <div class="col-span-2">
          <label class="block font-medium text-sm mb-2">SKU *</label>
          <input pInputText formControlName="sku" class="w-full" placeholder="Ej: PROD-001" />
        </div>

        <div class="col-span-2">
          <label class="block font-medium text-sm mb-2">Descripción *</label>
          <input pInputText formControlName="description" class="w-full" placeholder="Descripción del producto" />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Unidad</label>
          <input
            pInputText
            formControlName="unit"
            class="w-full"
            placeholder="Ej: Unidad, Caja, Kg"
            pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]*"
            (input)="keepOnlyLetters('unit')"
          />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Categoría</label>
          <p-select
            formControlName="categoryId"
            [options]="categories"
            optionLabel="name"
            optionValue="_id"
            placeholder="Seleccionar categoría"
            [showClear]="true"
            [style]="{'width': '100%'}" />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Costo Estimado</label>
          <p-inputNumber 
            formControlName="estimatedCost" 
            mode="currency" 
            currency="USD" 
            [minFractionDigits]="2"
            class="w-full"
          />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Stock Actual</label>
          <p-inputNumber 
            formControlName="currentStock" 
            [showButtons]="true"
            [min]="0"
            class="w-full"
          />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Stock Mínimo</label>
          <p-inputNumber 
            formControlName="minStock" 
            [showButtons]="true"
            [min]="0"
            class="w-full"
          />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Ubicación en Bodega</label>
          <input pInputText formControlName="warehouseLocation" class="w-full" placeholder="Ej: A-12-3" />
        </div>

        <div class="col-span-2">
          <p-checkbox 
            formControlName="isActive" 
            [binary]="true" 
            label="Producto activo" 
          />
        </div>
      </form>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button 
            label="Cancelar" 
            severity="secondary" 
            [outlined]="true" 
            (onClick)="onCancel()" 
          />
          <p-button 
            [label]="isEditMode ? 'Actualizar' : 'Crear'" 
            [loading]="isSaving" 
            [disabled]="!productForm.valid || isSaving" 
            (onClick)="onSave()" 
          />
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class ProductFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() isEditMode = false;
  @Input() isSaving = false;
  @Input() productData: ProductFormData | null = null;
  @Input() categories: Category[] = [];
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ProductFormData>();
  @Output() cancel = new EventEmitter<void>();

  productForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.group({
      sku: ['', Validators.required],
      description: ['', Validators.required],
      unit: ['Unidad', Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]*$/)],
      categoryId: [''],
      estimatedCost: [0],
      currentStock: [0],
      minStock: [0],
      warehouseLocation: [''],
      isActive: [true]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productData'] && this.productData) {
      this.productForm.patchValue({
        ...this.productData,
        unit: this.onlyLetters(this.productData.unit)
      });
    }
    
    if (changes['visible'] && !this.visible) {
      this.productForm.reset({ 
        unit: 'Unidad',
        estimatedCost: 0,
        currentStock: 0,
        minStock: 0,
        isActive: true 
      });
    }
  }

  onDialogHide(): void {
    this.visibleChange.emit(false);
    this.productForm.reset({ 
      unit: 'Unidad',
      estimatedCost: 0,
      currentStock: 0,
      minStock: 0,
      isActive: true 
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    if (this.productForm.valid) {
      this.save.emit(this.productForm.value);
    }
  }

  keepOnlyLetters(controlName: 'unit'): void {
    const control = this.productForm.get(controlName);
    const lettersValue = this.onlyLetters(control?.value);

    if (control?.value !== lettersValue) {
      control?.setValue(lettersValue, { emitEvent: false });
    }
  }

  private onlyLetters(value?: string | null): string {
    return String(value ?? '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, '');
  }
}
