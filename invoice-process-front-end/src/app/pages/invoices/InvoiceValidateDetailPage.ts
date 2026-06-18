import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { InvoiceService } from '@/core/services/InvoiceService';
import { NotificationService } from '@/shared/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-invoice-validate-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ProgressSpinnerModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    TagModule,
    CardModule,
    DividerModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    @if (isLoading()) {
      <div class="flex justify-center items-center min-h-screen">
        <p-progressSpinner />
      </div>
    } @else if (invoiceData) {
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- PDF Viewer (Izquierda) -->
        <div class="card h-full">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">Documento PDF</h3>
            @if (invoiceData.pdfUrl) {
              <div class="flex gap-2">
                <a [href]="invoiceData.pdfUrl" target="_blank" rel="noopener noreferrer">
                  <p-button 
                    label="Abrir" 
                    icon="pi pi-external-link" 
                    size="small"
                    [outlined]="true"
                  />
                </a>
                <p-button 
                  label="Descargar" 
                  icon="pi pi-download" 
                  size="small"
                  severity="secondary"
                  (onClick)="downloadPdf()"
                />
              </div>
            }
          </div>
          
          @if (invoiceData.pdfUrl) {
            <div class="border border-surface-200 rounded p-2 min-h-96 bg-surface-50 overflow-hidden">
              <!-- Usar object en lugar de embed para soporte de fallback -->
              <object 
                [data]="getSafeUrl(invoiceData.pdfUrl + '#toolbar=0&navpanes=0&scrollbar=0')" 
                type="application/pdf"
                width="100%" 
                height="600"
                class="rounded"
              >
                <!-- Fallback si object no funciona -->
                <div class="flex flex-col items-center justify-center p-8 h-full">
                  <i class="pi pi-file-pdf text-6xl text-red-500 mb-4"></i>
                  <p class="text-surface-700 font-medium mb-2">No se puede mostrar el PDF en el navegador</p>
                  <p class="text-surface-500 text-sm mb-4">Tu navegador no soporta visualización de PDFs inline</p>
                  <a [href]="invoiceData.pdfUrl" target="_blank" rel="noopener noreferrer">
                    <p-button 
                      label="Abrir PDF en nueva pestaña" 
                      icon="pi pi-external-link"
                    />
                  </a>
                  <a [href]="invoiceData.pdfUrl" download class="mt-2">
                    <p-button 
                      label="Descargar PDF" 
                      icon="pi pi-download"
                      severity="secondary"
                      [outlined]="true"
                    />
                  </a>
                  <p class="text-xs text-surface-400 mt-4 break-all max-w-md">{{ invoiceData.pdfUrl }}</p>
                </div>
              </object>
            </div>
          } @else {
            <div class="flex items-center justify-center min-h-96 bg-surface-50 rounded">
              <div class="text-center">
                <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-2"></i>
                <p class="text-surface-500">No hay PDF disponible</p>
              </div>
            </div>
          }
          
          <p class="text-xs text-surface-500 mt-2">
            Confianza de extracción: {{ (invoiceData.confidence * 100) | number:'1.0-0' }}%
          </p>
        </div>

        <!-- Datos Editables (Derecha) -->
        <div class="card h-full overflow-y-auto" [style.max-height]="'700px'">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">Validar Datos</h3>
            <div class="flex items-center gap-3">
              @if (invoiceData.extracted) {
                <p-tag 
                  value="Extraído" 
                  severity="info"
                />
              }
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium">Estado:</label>
                <p-select
                  [(ngModel)]="currentStatus"
                  [options]="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  [ngModelOptions]="{standalone: true}"
                  (onChange)="onStatusChange($event)"
                  styleClass="w-40"
                >
                  <ng-template pTemplate="selectedItem" let-option>
                    <p-tag [value]="option.label" [severity]="getStatusSeverity(option.value)" />
                  </ng-template>
                  <ng-template pTemplate="item" let-option>
                    <p-tag [value]="option.label" [severity]="getStatusSeverity(option.value)" />
                  </ng-template>
                </p-select>
              </div>
            </div>
          </div>

          <form [formGroup]="validationForm" (ngSubmit)="onSubmit()">
            <!-- Número de Factura -->
            <div class="mb-4">
              <label class="block font-medium text-sm mb-2">Número de Factura</label>
              <input 
                pInputText 
                formControlName="invoiceNumber"
                class="w-full"
                placeholder="Ej: NS2401-001"
              />
            </div>

            <!-- Fecha -->
            <div class="mb-4">
              <label class="block font-medium text-sm mb-2">Fecha</label>
              <input 
                pInputText 
                type="date"
                formControlName="date"
                class="w-full"
              />
            </div>

            <!-- Proveedor -->
            <div class="mb-4">
              <label class="block font-medium text-sm mb-2">Proveedor</label>
              <p-select
                formControlName="supplierId"
                [options]="suppliers()"
                optionLabel="name"
                optionValue="_id"
                placeholder="Seleccionar proveedor o dejar vacío para crear nuevo"
                [filter]="true"
                filterBy="name,taxId"
                styleClass="w-full"
                [showClear]="true"
              >
                <ng-template pTemplate="selectedItem" let-option>
                  <div *ngIf="option">
                    <div class="font-medium">{{ option.name }}</div>
                    <div class="text-xs text-surface-500">{{ option.taxId || 'Sin RUC/NIT' }}</div>
                  </div>
                </ng-template>
                <ng-template pTemplate="item" let-option>
                  <div>
                    <div class="font-medium">{{ option.name }}</div>
                    <div class="text-xs text-surface-500">{{ option.taxId || 'Sin RUC/NIT' }} • {{ option.country || 'Sin país' }}</div>
                  </div>
                </ng-template>
              </p-select>
              @if (validationForm.get('supplierId')?.value) {
                <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <i class="pi pi-check-circle"></i>
                  Proveedor Existente en BD
                </p>
              } @else {
                <div class="mt-2 p-3 bg-orange-50 border border-orange-200 rounded">
                  <p class="text-xs text-orange-800 font-semibold mb-2 flex items-center gap-1">
                    <i class="pi pi-info-circle"></i>
                    Nuevo Proveedor - Se creará automáticamente al validar
                  </p>
                  <p class="text-xs text-orange-700">
                    Nombre: <strong>{{ validationForm.get('supplierName')?.value || 'Sin nombre' }}</strong>
                  </p>
                </div>
              }
            </div>

            <!-- Moneda -->
            <div class="mb-4">
              <label class="block font-medium text-sm mb-2">Moneda</label>
              <p-select
                [options]="currencies"
                formControlName="currency"
                placeholder="Seleccionar moneda"
                class="w-full"
              />
            </div>

            <p-divider />

            <!-- Subtotal -->
            <div class="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label class="block font-medium text-sm mb-2">Subtotal</label>
                <p-inputNumber
                  formControlName="subtotal"
                  [disabled]="true"
                  mode="currency"
                  currency="USD"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block font-medium text-sm mb-2">Impuestos</label>
                <p-inputNumber
                  formControlName="tax"
                  [disabled]="true"
                  mode="currency"
                  currency="USD"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Total -->
            <div class="mb-4">
              <label class="block font-medium text-sm mb-2">Total</label>
              <p-inputNumber
                formControlName="total"
                mode="currency"
                currency="USD"
                class="w-full"
              />
            </div>

            <p-divider />

            <!-- Items Table -->
            <div class="mb-4">
              <label class="block font-medium text-sm mb-3">Items de la Factura ({{ items().length }} items)</label>
              <p-table [value]="items()" responsiveLayout="scroll" styleClass="text-xs">
                <ng-template pTemplate="header">
                  <tr>
                    <th style="width: 13%">SKU</th>
                    <th style="width: 30%">Producto</th>
                    <th style="width: 10%" class="text-center">Cant.</th>
                    <th style="width: 15%">P. Unit.</th>
                    <th style="width: 14%">Total</th>
                    <th style="width: 18%">Estado</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item let-i="rowIndex">
                  <tr>
                    <!-- SKU Editable o Read-Only cuando hay producto seleccionado -->
                    <td>
                      @if (item.productId) {
                        <div class="font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-1.5 rounded">
                          {{ getProductSKU(item.productId) }}
                        </div>
                      } @else {
                        <div class="flex gap-1">
                          <input
                            pInputText
                            [(ngModel)]="item.sku"
                            [ngModelOptions]="{standalone: true}"
                            placeholder="SKU o auto"
                            class="flex-1 text-xs p-2 font-mono border-orange-300"
                          />
                          <p-button
                            icon="pi pi-refresh"
                            [outlined]="true"
                            size="small"
                            severity="secondary"
                            (onClick)="generateSKU(item)"
                            [pTooltip]="'Generar SKU automático'"
                            tooltipPosition="top"
                            styleClass="h-8 w-8 p-0"
                          />
                        </div>
                      }
                    </td>
                    
                    <!-- Producto con Select mejorado -->
                    <td>
                      <p-select
                        [(ngModel)]="item.productId"
                        [ngModelOptions]="{standalone: true}"
                        [options]="products()"
                        optionLabel="description"
                        optionValue="_id"
                        [placeholder]="item.productId ? 'Seleccionar producto...' : (item.description || 'Producto nuevo - Seleccionar o dejar así')"
                        [filter]="true"
                        filterBy="description,sku"
                        styleClass="w-full text-xs"
                        [showClear]="true"
                        appendTo="body"
                        [scrollHeight]="'300px'"
                        (onChange)="onProductChange($event, item)"
                      >
                        <ng-template pTemplate="selectedItem" let-option>
                          @if (option) {
                            <div class="text-xs flex items-center gap-2">
                              <span class="font-mono text-primary-700 font-semibold">{{ option.sku }}</span>
                              <span>{{ option.description }}</span>
                            </div>
                          } @else if (item.description) {
                            <div class="text-xs text-orange-700 flex items-center gap-1">
                              <i class="pi pi-plus-circle text-[10px]"></i>
                              <span class="font-semibold">{{ item.description }}</span>
                              <span class="text-[10px] text-surface-500">(Nuevo producto)</span>
                            </div>
                          }
                        </ng-template>
                        <ng-template pTemplate="item" let-option>
                          <div class="text-xs py-1">
                            <div class="font-semibold flex items-center gap-2">
                              <span class="font-mono text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded text-[10px]">{{ option.sku }}</span>
                              <span>{{ option.description }}</span>
                            </div>
                            <div class="text-surface-500 text-[10px] mt-0.5">
                              Stock: {{ option.currentStock || 0 }} | Costo Est.: {{ option.estimatedCost | currency:'USD':'symbol':'1.2-2' }}
                            </div>
                          </div>
                        </ng-template>
                      </p-select>
                    </td>
                    
                    <!-- Cantidad -->
                    <td>
                      <div class="flex justify-center">
                        <p-inputNumber
                          [(ngModel)]="item.quantity"
                          [ngModelOptions]="{standalone: true}"
                          [showButtons]="true"
                          buttonLayout="horizontal"
                          inputStyleClass="text-sm text-center w-20"
                          [min]="0"
                          [step]="1"
                          decrementButtonClass="p-button-sm"
                          incrementButtonClass="p-button-sm"
                          (onInput)="updateItemTotal(item)"
                        />
                      </div>
                    </td>
                    
                    <!-- Precio Unitario -->
                    <td>
                      <p-inputNumber
                        [(ngModel)]="item.unitPrice"
                        [ngModelOptions]="{standalone: true}"
                        mode="currency"
                        currency="USD"
                        inputStyleClass="text-xs p-1"
                        styleClass="w-full"
                        (onInput)="updateItemTotal(item)"
                      />
                    </td>
                    
                    <!-- Total -->
                    <td>
                      <div class="font-semibold text-sm text-surface-900">
                        {{ (item.quantity * item.unitPrice) | currency:'USD':'symbol':'1.2-2' }}
                      </div>
                    </td>
                    
                    <!-- Estado -->
                    <td>
                      @if (item.productId) {
                        <p-tag 
                          value="Existente" 
                          severity="success"
                          [style]="{'font-size': '0.65rem'}"
                          icon="pi pi-check"
                        />
                      } @else {
                        <p-tag 
                          value="Nuevo" 
                          severity="warn"
                          [style]="{'font-size': '0.65rem'}"
                          icon="pi pi-plus"
                        />
                      }
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="6" class="text-center p-4 text-surface-500">
                      No hay items en la factura
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Notas -->
            <div class="mb-4">
              <label class="block font-medium text-sm mb-2">Observaciones</label>
              <textarea 
                pInputText 
                formControlName="notes"
                class="w-full"
                rows="3"
                placeholder="Notas adicionales..."
              ></textarea>
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
                label="Validar" 
                [loading]="isLoading()"
                [disabled]="isLoading() || !validationForm.valid"
                icon="pi pi-check"
                (onClick)="onSubmit()"
              />
            </div>
          </form>
        </div>
      </div>
    }

    <p-toast />
  `
})
export class InvoiceValidateDetailPage implements OnInit {
  invoiceId: string = '';
  invoiceData: any = null;
  items = signal<any[]>([]);
  isLoading = signal(false);
  validationForm: FormGroup;
  suppliers = signal<any[]>([]);
  products = signal<any[]>([]);
  currentStatus: string = 'EXTRACTED';
  
  statusOptions = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Procesando', value: 'PROCESSING' },
    { label: 'Extraído', value: 'EXTRACTED' },
    { label: 'Validado', value: 'VALIDATED' },
    { label: 'Finalizado', value: 'FINALIZED' },
    { label: 'Error', value: 'ERROR' }
  ];
  
  currencies = [
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'MXN', value: 'MXN' },
    { label: 'CLP', value: 'CLP' },
    { label: 'ARS', value: 'ARS' }
  ];

  route = inject(ActivatedRoute);
  router = inject(Router);
  invoiceService = inject(InvoiceService);
  notificationService = inject(NotificationService);
  fb = inject(FormBuilder);
  messageService = inject(MessageService);
  sanitizer = inject(DomSanitizer);
  http = inject(HttpClient);

  constructor() {
    this.validationForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      date: ['', Validators.required],
      supplierId: [''], // No requerido - se puede crear nuevo
      supplierName: [''],
      currency: ['USD', Validators.required],
      subtotal: [0],
      tax: [0],
      total: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.invoiceId) {
      this.loadSuppliers();
      this.loadProducts();
      this.loadInvoiceData();
      this.checkDuplicates();
    }
  }

  loadSuppliers(): void {
    this.http.get<any>(`${environment.apiUrl}/suppliers`).subscribe({
      next: (response) => {
        this.suppliers.set(response.suppliers || []);
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  loadProducts(): void {
    this.http.get<any>(`${environment.apiUrl}/products`).subscribe({
      next: (response) => {
        this.products.set(response.products || []);
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadInvoiceData(): void {
    this.isLoading.set(true);
    this.invoiceService.getInvoiceById(this.invoiceId).subscribe({
      next: (response: any) => {
        const invoice = response.invoice || response;
        this.prepareValidationData(invoice);
        this.loadPdfUrl(); // Cargar URL firmada del PDF
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.notificationService.error('Error', 'No se pudo cargar la factura');
        this.isLoading.set(false);
        this.router.navigate(['/invoices']);
      }
    });
  }

  private loadPdfUrl(): void {
    this.invoiceService.getFileUrl(this.invoiceId, 'view').subscribe({
      next: (response) => {
        if (this.invoiceData) {
          this.invoiceData.pdfUrl = response.url;
          console.log('PDF URL cargada:', response.url);
        }
      },
      error: (error: any) => {
        console.error('Error cargando PDF URL:', error);
        this.notificationService.error('Error', 'No se pudo cargar el PDF');
      }
    });
  }

  checkDuplicates(): void {
    this.invoiceService.checkDuplicates(this.invoiceId).subscribe({
      next: (response: any) => {
        if (response.duplicates) {
          const { supplier, items } = response.duplicates;
          
          // Actualizar estado del proveedor
          if (supplier.exists) {
            this.messageService.add({
              severity: 'info',
              summary: 'Proveedor Existente',
              detail: supplier.message,
              life: 5000
            });
          }
          
          // Marcar items con su estado de duplicado
          const currentItems = this.items();
          if (currentItems && currentItems.length > 0 && items) {
            const updatedItems = currentItems.map((item: any, idx: number) => ({
              ...item,
              status: items[idx]?.exists ? 'EXISTING' : 'NEW',
              productId: items[idx]?.productId || null
            }));
            this.items.set(updatedItems);
          }
        }
      },
      error: (error: any) => {
        console.error('Error checking duplicates:', error);
      }
    });
  }

  prepareValidationData(invoice: any): void {
    const extracted = invoice.extractedJson || {};
    
    // Inicializar estado actual
    this.currentStatus = invoice.status || 'EXTRACTED';
    
    console.log('📄 Invoice completo:', invoice);
    console.log('� Extracted JSON:', extracted);
    console.log('🔗 PDF ubicacionArchivo:', invoice.ubicacionArchivo);
    
    // Formatear fecha correctamente
    let formattedDate = '';
    if (extracted.cabecera?.fechaEmision || extracted.cabecera?.fechaFactura) {
      formattedDate = this.formatDateToInput(extracted.cabecera.fechaEmision || extracted.cabecera.fechaFactura);
    } else if (invoice.invoiceDate) {
      formattedDate = this.formatDateToInput(invoice.invoiceDate);
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }

    // Obtener nombre del proveedor
    let supplierName = '';
    let supplierObject = null;
    
    if (typeof invoice.supplierId === 'object' && invoice.supplierId !== null) {
      supplierName = invoice.supplierId.name || '';
      supplierObject = invoice.supplierId;
    } else {
      supplierName = extracted.cabecera?.proveedorNombre || invoice.supplierName || '';
    }
    
    // La URL del PDF se cargará dinámicamente mediante loadPdfUrl()
    let pdfUrl = '';
    
    // SOLO usar items extraídos de Gemini, NO items guardados
    let itemsToUse: any[] = [];
    
    if (extracted.items && extracted.items.length > 0) {
      console.log('✅ Usando items extraídos de Gemini');
      itemsToUse = extracted.items.map((item: any, index: number) => ({
        itemId: `item-${invoice._id}-${index + 1}`,
        productId: null, // Usuario seleccionará
        description: item.descripcion || item.product || '',
        sku: item.codigoProducto || '',
        quantity: item.cantidad || item.quantity || 0,
        unitPrice: item.precioUnitario || item.price || 0,
        totalPrice: item.totalLinea || item.montoTotal || (item.cantidad * item.precioUnitario) || 0,
      }));
    } else {
      console.warn('⚠️ No hay items extraídos');
    }
    
    this.invoiceData = {
      invoiceNumber: extracted.cabecera?.numeroFactura || invoice.invoiceNumber || '',
      date: formattedDate,
      supplier: supplierObject,
      supplierId: supplierObject?._id || invoice.supplierId,
      supplierName: supplierName,
      currency: extracted.cabecera?.moneda || invoice.currency || 'USD',
      subtotal: extracted.cabecera?.subtotal || invoice.subtotal || 0,
      tax: extracted.cabecera?.impuestos || invoice.tax || 0,
      total: extracted.cabecera?.total || invoice.total || 0,
      notes: extracted.cabecera?.observaciones || invoice.notes || '',
      items: itemsToUse,
      pdfUrl: pdfUrl,
      ubicacionArchivo: invoice.ubicacionArchivo || null,
      extracted: !!invoice.extractedJson,
      confidence: invoice.confianzaExtraccion || 0
    };

    console.log('📊 InvoiceData final:', this.invoiceData);
    console.log('📦 Items a mostrar:', itemsToUse.length);

    this.items.set(this.invoiceData.items);
    this.populateForm();
  }

  formatDateToInput(date: any): string {
    if (!date) return new Date().toISOString().split('T')[0];
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return dateObj.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  populateForm(): void {
    this.validationForm.patchValue({
      invoiceNumber: this.invoiceData.invoiceNumber,
      date: this.invoiceData.date,
      supplierId: this.invoiceData.supplierId || '',
      supplierName: this.invoiceData.supplierName,
      currency: this.invoiceData.currency,
      subtotal: this.invoiceData.subtotal,
      tax: this.invoiceData.tax,
      total: this.invoiceData.total,
      notes: this.invoiceData.notes
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
    const formData = this.validationForm.value;

    // Preparar items con información completa para crear productos
    const itemsToSend = this.items().map((item: any) => ({
      itemId: item.itemId,
      productId: item.productId || null, // Si usuario seleccionó producto existente
      sku: item.sku || '',
      description: item.description,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      totalLine: (item.quantity || 0) * (item.unitPrice || 0)
    }));

    console.log('📤 Enviando items para validación:', itemsToSend);

    // Preparar datos del proveedor para crear si es nuevo
    const validationData: any = {
      invoiceNumber: formData.invoiceNumber,
      date: formData.date,
      total: formData.total,
      subtotal: formData.subtotal,
      tax: formData.tax,
      currency: formData.currency,
      notes: formData.notes,
      items: itemsToSend
    };

    // Si hay supplierId seleccionado, enviarlo
    if (formData.supplierId) {
      validationData.supplierId = formData.supplierId;
    } else {
      // Si no hay supplierId, enviar datos para crear proveedor
      validationData.supplierName = formData.supplierName || this.invoiceData.supplierName;
      validationData.country = this.invoiceData.country || 'N/A';
    }

    this.invoiceService.finalizeValidation(this.invoiceId, validationData).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de validación:', response);
        
        const messages = [`Factura validada correctamente.`];
        if (response.productsCreated) messages.push(`Productos creados: ${response.productsCreated}`);
        if (response.productsUpdated) messages.push(`Productos actualizados: ${response.productsUpdated}`);
        if (response.supplierCreated) messages.push(`Proveedor creado automáticamente`);
        
        this.notificationService.success('Éxito', messages.join(' • '));
        this.isLoading.set(false);
        this.router.navigate(['/invoices/management']);
      },
      error: (error: any) => {
        console.error('❌ Error validando factura:', error);
        this.notificationService.error('Error', error?.error?.message || 'Error al validar la factura');
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/invoices/management']);
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getProductSKU(productId: string): string {
    const product = this.products().find(p => p._id === productId);
    return product?.sku || 'N/A';
  }

  onProductChange(event: any, item: any): void {
    const selectedProduct = this.products().find(p => p._id === event.value);
    if (selectedProduct) {
      // Actualizar item con datos del producto seleccionado
      item.sku = selectedProduct.sku;
      item.description = selectedProduct.description;
      item.unitPrice = selectedProduct.estimatedCost || item.unitPrice;
      this.updateItemTotal(item);
    }
  }

  updateItemTotal(item: any): void {
    item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
  }

  generateSKU(item: any): void {
    // Generar SKU automático único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    item.sku = `AUTO-${timestamp}-${random}`;
    this.notificationService.info('SKU Generado', `SKU: ${item.sku}`);
  }

  downloadPdf(): void {
    if (this.invoiceId && this.invoiceData?.ubicacionArchivo?.fileName) {
      this.invoiceService.downloadPdf(this.invoiceId, this.invoiceData.ubicacionArchivo.fileName);
      this.notificationService.success('Descarga iniciada', 'El PDF se está descargando');
    } else {
      this.notificationService.error('Error', 'No se encontró el archivo PDF');
    }
  }

  onStatusChange(event: any): void {
    const newStatus = event.value;
    this.invoiceService.updateStatus(this.invoiceId, newStatus).subscribe({
      next: (response) => {
        this.notificationService.success('Estado actualizado', `Estado cambiado a: ${newStatus}`);
        if (this.invoiceData) {
          this.invoiceData.status = newStatus;
        }
      },
      error: (error) => {
        this.notificationService.error('Error', 'No se pudo actualizar el estado');
        // Revertir al estado anterior
        this.currentStatus = this.invoiceData?.status || 'EXTRACTED';
      }
    });
  }

  getStatusSeverity(status: string): 'secondary' | 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'secondary' | 'success' | 'info' | 'warn' | 'danger'> = {
      'PENDING': 'secondary',
      'PROCESSING': 'info',
      'EXTRACTED': 'info',
      'VALIDATED': 'success',
      'FINALIZED': 'success',
      'ERROR': 'danger'
    };
    return severities[status] || 'secondary';
  }
}
