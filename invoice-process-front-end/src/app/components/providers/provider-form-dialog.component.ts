import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';

export interface ProviderFormData {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-provider-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule
  ],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [header]="isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'"
      [modal]="true"
      [style]="{width: '600px'}"
      [draggable]="false"
      [resizable]="false"
      (onHide)="onDialogHide()"
    >
      <form [formGroup]="providerForm" class="grid grid-cols-2 gap-4 mt-4">
        <div class="col-span-2">
          <label class="block font-medium text-sm mb-2">Nombre *</label>
          <input pInputText formControlName="name" class="w-full" placeholder="Nombre del proveedor" />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">NIT/RUC</label>
          <input
            pInputText
            formControlName="taxId"
            class="w-full"
            placeholder="Ej: 8001234561"
            inputmode="numeric"
            pattern="[0-9]*"
            (input)="keepOnlyNumbers('taxId')"
          />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Email</label>
          <input pInputText type="email" formControlName="email" class="w-full" placeholder="correo@ejemplo.com" />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Teléfono</label>
          <input
            pInputText
            formControlName="phone"
            class="w-full"
            placeholder="Ej: 573001234567"
            inputmode="numeric"
            pattern="[0-9]*"
            (input)="keepOnlyNumbers('phone')"
          />
        </div>

        <div>
          <label class="block font-medium text-sm mb-2">Ciudad</label>
          <input pInputText formControlName="city" class="w-full" placeholder="Ej: Bogotá" />
        </div>

        <div class="col-span-2">
          <label class="block font-medium text-sm mb-2">País</label>
          <input pInputText formControlName="country" class="w-full" placeholder="Ej: Colombia" />
        </div>

        <div class="col-span-2">
          <label class="block font-medium text-sm mb-2">Dirección</label>
          <input pInputText formControlName="address" class="w-full" placeholder="Dirección completa" />
        </div>

        <div class="col-span-2">
          <p-checkbox 
            formControlName="isActive" 
            [binary]="true" 
            label="Proveedor activo" 
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
            [disabled]="!providerForm.valid || isSaving" 
            (onClick)="onSave()" 
          />
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class ProviderFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() isEditMode = false;
  @Input() isSaving = false;
  @Input() providerData: ProviderFormData | null = null;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ProviderFormData>();
  @Output() cancel = new EventEmitter<void>();

  providerForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.providerForm = this.fb.group({
      name: ['', Validators.required],
      taxId: ['', Validators.pattern(/^[0-9]*$/)],
      email: ['', Validators.email],
      phone: ['', Validators.pattern(/^[0-9]*$/)],
      address: [''],
      city: [''],
      country: [''],
      isActive: [true]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['providerData'] && this.providerData) {
      this.providerForm.patchValue({
        ...this.providerData,
        taxId: this.onlyNumbers(this.providerData.taxId),
        phone: this.onlyNumbers(this.providerData.phone)
      });
    }
    
    if (changes['visible'] && !this.visible) {
      this.providerForm.reset({ isActive: true });
    }
  }

  onDialogHide(): void {
    this.visibleChange.emit(false);
    this.providerForm.reset({ isActive: true });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    if (this.providerForm.valid) {
      this.save.emit(this.providerForm.value);
    }
  }

  keepOnlyNumbers(controlName: 'taxId' | 'phone'): void {
    const control = this.providerForm.get(controlName);
    const numericValue = this.onlyNumbers(control?.value);

    if (control?.value !== numericValue) {
      control?.setValue(numericValue, { emitEvent: false });
    }
  }

  private onlyNumbers(value?: string | null): string {
    return String(value ?? '').replace(/\D/g, '');
  }
}
