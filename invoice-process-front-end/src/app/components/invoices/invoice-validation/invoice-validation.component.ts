import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface ValidationData {
  invoiceNumber: string;
  date: string;
  supplier: any;
  total: number;
  items: any[];
  pdfUrl: string;
  extracted: boolean;
  confidence: number;
}

export interface ValidationResult {
  data: ValidationData;
  suppliers: any[];
  products: any[];
}

@Component({
  selector: 'app-invoice-validation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    CardModule,
    DividerModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- PDF Viewer -->
      <div class="card">
        <h3 class="text-xl font-bold mb-4">Documento PDF</h3>
        @if (validationData.pdfUrl) {
          <div class="border border-surface-200 rounded p-4 min-h-96">
            <iframe 
              [src]="getSafeUrl(validationData.pdfUrl)" 
              width="100%" 
              height="500"
              class="rounded"
            ></iframe>
          </div>
        } @else {
          <div class="flex items-center justify-center min-h-96 bg-surface-50 rounded">
            <p class="text-surface-500">No hay PDF disponible</p>
          </div>
        }
      </div>

      <!-- Validation Form -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold">Validar y Editar Datos</h3>
          @if (validationData.extracted) {
            <p-tag 
              [value]="'Extraído automáticamente'" 
              severity="info"
              [style]="{'font-size': '0.75rem'}"
            />
          }
        </div>

        <!-- @if (validationData.confidence) {
          <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p class="text-sm">
              <strong>Confianza de extracción:</strong> {{ (validationData.confidence * 100) | number:'1.0-0' }}%
            </p>
          </div>
        } -->

        <form [formGroup]="validationForm" (ngSubmit)="onSubmit()">
          <!-- Número de Factura -->
          <div class="mb-4">
            <label class="block font-medium mb-2">Número de Factura</label>
            <input 
              pInputText 
              formControlName="invoiceNumber"
              class="w-full"
              placeholder="Ej: NS2401-001"
            />
          </div>

          <!-- Fecha -->
          <div class="mb-4">
            <label class="block font-medium mb-2">Fecha</label>
            <input 
              pInputText 
              type="date"
              formControlName="date"
              class="w-full"
            />
          </div>

          <!-- Proveedor -->
          <div class="mb-4">
            <label class="block font-medium mb-2">Proveedor</label>
            <p-select
              [options]="suppliers"
              optionLabel="name"
              optionValue="_id"
              formControlName="supplierId"
              placeholder="Seleccionar proveedor"
              [showClear]="true"
              class="w-full"
            >
              <ng-template pTemplate="item" let-option>
                <div class="flex items-center gap-2">
                  <span>{{ option.name }}</span>
                  <p-tag 
                    [value]="'Existente'" 
                    severity="success"
                    [style]="{'font-size': '0.7rem'}"
                  />
                </div>
              </ng-template>
            </p-select>
          </div>

          <!-- Total -->
          <div class="mb-4">
            <label class="block font-medium mb-2">Total</label>
            <p-inputNumber
              formControlName="total"
              mode="currency"
              currency="USD"
              locale="en-US"
              [useGrouping]="true"
              class="w-full"
            />
          </div>

          <p-divider />

          <!-- Items Table -->
          <div class="mb-4">
            <h4 class="font-bold mb-3">Items de la Factura</h4>
            <p-table [value]="items()" responsiveLayout="scroll" class="text-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item>
                <tr>
                  <td>{{ item.productName }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unitPrice | currency }}</td>
                  <td>{{ item.totalPrice | currency }}</td>
                  <td>
                    <p-tag 
                      [value]="item.status === 'NEW' ? 'Nuevo' : 'Existente'" 
                      [severity]="item.status === 'NEW' ? 'info' : 'success'"
                      [style]="{'font-size': '0.7rem'}"
                    />
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 justify-end">
            <p-button 
              label="Cancelar" 
              severity="secondary"
              [outlined]="true"
              (onClick)="onCancel()"
            />
            <p-button 
              label="Guardar Factura" 
              [loading]="isLoading()"
              [disabled]="isLoading() || !validationForm.valid"
              (onClick)="onSubmit()"
            />
          </div>
        </form>
      </div>
    </div>

    <p-toast />
  `
})
export class InvoiceValidationComponent implements OnInit {
  @Input() validationData: ValidationData = {
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplier: null,
    total: 0,
    items: [],
    pdfUrl: '',
    extracted: false,
    confidence: 0
  };
  @Input() suppliers: any[] = [];
  @Input() products: any[] = [];

  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  validationForm: FormGroup;
  items = signal<any[]>([]);
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private sanitizer: DomSanitizer
  ) {
    this.validationForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      date: ['', Validators.required],
      supplierId: [''],
      total: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.populateForm();
    this.items.set(this.validationData.items || []);
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  populateForm(): void {
    this.validationForm.patchValue({
      invoiceNumber: this.validationData.invoiceNumber,
      date: this.validationData.date,
      supplierId: this.validationData.supplier?._id || '',
      total: this.validationData.total
    });
  }

  onSubmit(): void {
    if (this.validationForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    this.isLoading.set(true);
    const formData = {
      ...this.validationForm.value,
      items: this.items(),
      pdfUrl: this.validationData.pdfUrl
    };

    this.submit.emit(formData);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
