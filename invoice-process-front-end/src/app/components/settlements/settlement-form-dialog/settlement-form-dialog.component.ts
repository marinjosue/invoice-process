import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-settlement-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    TagModule
  ],
  template: `
    <p-dialog 
      [header]="isEditMode ? 'Editar Liquidación' : 'Nueva Liquidación'"
      [(visible)]="visible"
      [modal]="true"
      [style]="{width: '600px'}"
      (onHide)="onDialogHide()">
      <form [formGroup]="settlementForm">
        <div class="flex flex-col gap-4">
          <!-- Selector de Facturas -->
          <div class="field">
            <label for="invoices" class="font-semibold">Facturas *</label>
            <p-multiSelect
              id="invoices"
              formControlName="invoices"
              [options]="availableInvoices"
              optionLabel="invoiceNumber"
              optionValue="_id"
              placeholder="Seleccionar facturas"
              [filter]="true"
              filterBy="invoiceNumber,status"
              [showToggleAll]="true"
              appendTo="body"
              [style]="{'width': '100%'}">
              <ng-template let-invoice pTemplate="item">
                <div class="flex justify-between w-full">
                  <span>{{ invoice.invoiceNumber }}</span>
                  <span class="text-sm text-gray-500">{{ invoice.total | currency }}</span>
                </div>
              </ng-template>
            </p-multiSelect>
            <small class="text-surface-500">
              Seleccionadas: {{ settlementForm.get('invoices')?.value?.length || 0 }}
            </small>
          </div>

          <!-- Costos Adicionales -->
          <div class="field">
            <label for="costs" class="font-semibold">Costos Adicionales</label>
            <p-inputNumber
              id="costs"
              formControlName="total_additional_costs"
              mode="currency"
              currency="USD"
              locale="es-US"
              [style]="{'width': '100%'}" 
              placeholder="Flete, seguro, impuestos, etc."/>
            <small class="text-surface-500">
              Costos adicionales (flete, seguro, etc.) que se prorratearán
            </small>
          </div>

          <!-- Estado -->
          <div class="field">
            <label for="status" class="font-semibold">Estado</label>
            <p-select
              id="status"
              formControlName="status"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              appendTo="body"
              [style]="{'width': '100%'}">
              <ng-template let-status pTemplate="selectedItem">
                <p-tag [value]="status.label" [severity]="status.severity" />
              </ng-template>
              <ng-template let-status pTemplate="item">
                <p-tag [value]="status.label" [severity]="status.severity" />
              </ng-template>
            </p-select>
            <small class="text-surface-500">
              💡 Para finalizar una liquidación, use el botón "Finalizar" en la tabla
            </small>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <p-button 
          label="Cancelar" 
          severity="secondary" 
          (onClick)="onCancel()" />
        <p-button 
          [label]="isEditMode ? 'Actualizar' : 'Crear'"
          [loading]="isSaving"
          (onClick)="onSave()"
          [disabled]="!settlementForm.valid" />
      </ng-template>
    </p-dialog>
  `
})
export class SettlementFormDialogComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() availableInvoices: any[] = [];
  @Input() settlementData: any = null;
  @Input() isSaving: boolean = false;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  settlementForm: FormGroup;
  
  // Opciones completas (solo para visualización)
  allStatusOptions = [
    { label: 'BORRADOR', value: 'DRAFT', severity: 'info' },
    { label: 'FINALIZADO', value: 'FINALIZED', severity: 'success' },
    { label: 'CANCELADO', value: 'CANCELLED', severity: 'danger' }
  ];

  // Opciones permitidas para edición (sin FINALIZED - solo se alcanza con el botón Finalizar)
  statusOptions = [
    { label: 'BORRADOR', value: 'DRAFT', severity: 'info' },
    { label: 'CANCELADO', value: 'CANCELLED', severity: 'danger' }
  ];

  constructor(private fb: FormBuilder) {
    this.settlementForm = this.fb.group({
      invoices: [[], Validators.required],
      total_additional_costs: [0],
      status: ['DRAFT']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settlementData'] && this.settlementData) {
      // Si la liquidación está FINALIZED, forzar a DRAFT para edición
      // (FINALIZED solo se alcanza con el botón Finalizar)
      const dataToLoad = { ...this.settlementData };
      if (dataToLoad.status === 'FINALIZED') {
        dataToLoad.status = 'DRAFT';
      }
      this.settlementForm.patchValue(dataToLoad);
    }
    
    if (changes['visible'] && !this.visible) {
      this.resetForm();
    }
  }

  onSave(): void {
    if (this.settlementForm.valid) {
      this.save.emit(this.settlementForm.value);
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.onDialogHide();
  }

  onDialogHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm(): void {
    this.settlementForm.reset({
      invoices: [],
      total_additional_costs: 0,
      status: 'DRAFT'
    });
  }
}
