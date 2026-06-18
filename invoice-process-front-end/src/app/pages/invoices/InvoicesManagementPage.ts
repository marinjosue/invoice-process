import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '@/shared/services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-invoices-management-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Gestión de Facturas</h2>
        <p-button label="Cargar Nueva Factura" icon="pi pi-upload" (onClick)="navigateToUpload()" />
      </div>

      <!-- Filtros -->
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="field">
          <label for="filterStatus">Estado</label>
          <p-select
            id="filterStatus"
            [(ngModel)]="selectedStatusFilter"
            [options]="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="applyFilters()"
            [style]="{'width': '100%'}" />
        </div>

        <div class="field">
          <label for="filterSupplier">Proveedor</label>
          <p-select
            id="filterSupplier"
            [(ngModel)]="selectedSupplierFilter"
            [options]="suppliers()"
            optionLabel="name"
            optionValue="_id"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="applyFilters()"
            [style]="{'width': '100%'}" />
        </div>

        <div class="field">
          <label for="searchTerm">Buscar</label>
          <input
            pInputText
            id="searchTerm"
            [(ngModel)]="searchTerm"
            (input)="applyFilters()"
            placeholder="Número de factura..."
            [style]="{'width': '100%'}" />
        </div>
      </div>

      <p-table [value]="filteredInvoices()" [loading]="isLoading()" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>Número</th>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Moneda</th>
            <th>Subtotal</th>
            <th>Impuesto</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-invoice>
          <tr>
            <td><strong>{{ invoice.invoiceNumber || 'Sin número' }}</strong></td>
            <td>{{ invoice.invoiceDate | date:'dd/MM/yyyy' }}</td>
            <td>{{ getSupplierName(invoice.supplierId) }}</td>
            <td>{{ invoice.currency || 'USD' }}</td>
            <td>{{ invoice.subtotal | currency }}</td>
            <td>{{ invoice.tax | currency }}</td>
            <td><strong>{{ invoice.total | currency }}</strong></td>
            <td>
              <p-tag [value]="invoice.status" [severity]="getStatusSeverity(invoice.status)" />
            </td>
            <td>
              <p-button 
                icon="pi pi-eye" 
                [text]="true" 
                (onClick)="viewInvoice(invoice._id)" 
                pTooltip="Ver detalles" />
              <p-button 
                icon="pi pi-pencil" 
                [text]="true" 
                (onClick)="editInvoice(invoice._id!)" 
                pTooltip="Editar" />
              <p-button 
                icon="pi pi-file-pdf" 
                [text]="true" 
                severity="info"
                (onClick)="downloadPdf(invoice._id!, invoice.ubicacionArchivo?.fileName)" 
                pTooltip="Descargar PDF" />
              <p-button 
                icon="pi pi-trash" 
                [text]="true" 
                severity="danger" 
                (onClick)="deleteInvoice(invoice)" 
                pTooltip="Eliminar" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center">No hay facturas registradas</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Dialog para editar factura -->
    <p-dialog 
      header="Editar Factura"
      [(visible)]="showDialog"
      [modal]="true"
      [style]="{width: '700px'}"
      (onHide)="closeDialog()">
      <form [formGroup]="invoiceForm">
        <div class="grid grid-cols-2 gap-4">
          <div class="field col-span-2">
            <label for="invoiceNumber" class="font-semibold">Número de Factura *</label>
            <input
              pInputText
              id="invoiceNumber"
              formControlName="invoiceNumber"
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="invoiceDate" class="font-semibold">Fecha *</label>
            <input
              pInputText
              type="date"
              id="invoiceDate"
              formControlName="invoiceDate"
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="supplierId" class="font-semibold">Proveedor *</label>
            <p-select
              id="supplierId"
              formControlName="supplierId"
              [options]="suppliers()"
              optionLabel="name"
              optionValue="_id"
              placeholder="Seleccionar proveedor"
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="currency" class="font-semibold">Moneda</label>
            <p-select
              id="currency"
              formControlName="currency"
              [options]="currencyOptions"
              optionLabel="label"
              optionValue="value"
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="status" class="font-semibold">Estado</label>
            <p-select
              id="status"
              formControlName="status"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              [style]="{'width': '100%'}">
              <ng-template let-status pTemplate="selectedItem">
                <p-tag [value]="status.label" [severity]="status.severity" />
              </ng-template>
              <ng-template let-status pTemplate="item">
                <p-tag [value]="status.label" [severity]="status.severity" />
              </ng-template>
            </p-select>
          </div>

          <div class="field">
            <label for="subtotal" class="font-semibold">Subtotal</label>
            <p-inputNumber
              id="subtotal"
              formControlName="subtotal"
              mode="currency"
              currency="USD"
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="tax" class="font-semibold">Impuesto</label>
            <p-inputNumber
              id="tax"
              formControlName="tax"
              mode="currency"
              currency="USD"
              [style]="{'width': '100%'}" />
          </div>

          <div class="field">
            <label for="total" class="font-semibold">Total</label>
            <p-inputNumber
              id="total"
              formControlName="total"
              mode="currency"
              currency="USD"
              [style]="{'width': '100%'}" />
          </div>

          <div class="field col-span-2">
            <label for="notes" class="font-semibold">Notas</label>
            <textarea
              pInputText
              id="notes"
              formControlName="notes"
              rows="3"
              [style]="{'width': '100%'}"></textarea>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" (onClick)="closeDialog()" />
        <p-button 
          label="Guardar"
          [loading]="isSaving"
          (onClick)="saveInvoice()"
          [disabled]="!invoiceForm.valid" />
      </ng-template>
    </p-dialog>

    <p-confirmDialog />
  `
})
export class InvoicesManagementPage implements OnInit {
  invoices = signal<any[]>([]);
  filteredInvoices = signal<any[]>([]);
  suppliers = signal<any[]>([]);
  isLoading = signal(false);
  showDialog = false;
  isSaving = false;
  currentInvoiceId: string | null = null;
  invoiceForm: FormGroup;

  selectedStatusFilter: string | null = null;
  selectedSupplierFilter: string | null = null;
  searchTerm: string = '';

  statusOptions = [
    { label: 'PENDIENTE', value: 'PENDING', severity: 'secondary' },
    { label: 'PROCESANDO', value: 'PROCESSING', severity: 'warn' },
    { label: 'EXTRAÍDO', value: 'EXTRACTED', severity: 'info' },
    { label: 'VALIDADO', value: 'VALIDATED', severity: 'info' },
    { label: 'FINALIZADO', value: 'FINALIZED', severity: 'success' },
    { label: 'ERROR', value: 'ERROR', severity: 'danger' }
  ];

  currencyOptions = [
    { label: 'USD - Dólar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'CRC - Colón', value: 'CRC' }
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      invoiceDate: ['', Validators.required],
      supplierId: ['', Validators.required],
      currency: ['USD'],
      status: ['PENDING'],
      subtotal: [0],
      tax: [0],
      total: [0],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadSuppliers();
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/invoices`).subscribe({
      next: (response) => {
        const invoiceList = response.invoices || [];
        this.invoices.set(invoiceList);
        this.filteredInvoices.set(invoiceList);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar las facturas');
        this.isLoading.set(false);
      }
    });
  }

  loadSuppliers(): void {
    this.http.get<any>(`${environment.apiUrl}/suppliers`).subscribe({
      next: (response) => {
        this.suppliers.set(response.suppliers || []);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar los proveedores');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.invoices()];

    if (this.selectedStatusFilter) {
      filtered = filtered.filter(inv => inv.status === this.selectedStatusFilter);
    }

    if (this.selectedSupplierFilter) {
      filtered = filtered.filter(inv => 
        inv.supplierId?._id === this.selectedSupplierFilter || 
        inv.supplierId === this.selectedSupplierFilter
      );
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(term)
      );
    }

    this.filteredInvoices.set(filtered);
  }

  navigateToUpload(): void {
    this.router.navigate(['/invoices/upload']);
  }

  viewInvoice(id: string): void {
    this.router.navigate(['/invoices/validate', id]);
  }

  editInvoice(id: string): void {
    this.currentInvoiceId = id;
    this.http.get<any>(`${environment.apiUrl}/invoices/${id}`).subscribe({
      next: (response) => {
        const invoice = response.invoice;
        const supplierId = typeof invoice.supplierId === 'object' 
          ? invoice.supplierId._id 
          : invoice.supplierId;
        
        this.invoiceForm.patchValue({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
          supplierId: supplierId,
          currency: invoice.currency || 'USD',
          status: invoice.status || 'PENDING',
          subtotal: invoice.subtotal || 0,
          tax: invoice.tax || 0,
          total: invoice.total || 0,
          notes: invoice.notes || ''
        });
        this.showDialog = true;
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo cargar la factura');
      }
    });
  }

  saveInvoice(): void {
    if (!this.invoiceForm.valid || !this.currentInvoiceId) return;

    this.isSaving = true;
    const formData = this.invoiceForm.value;

    this.http.put(`${environment.apiUrl}/invoices/${this.currentInvoiceId}`, formData).subscribe({
      next: () => {
        this.notificationService.success('Éxito', 'Factura actualizada');
        this.closeDialog();
        this.loadInvoices();
        this.isSaving = false;
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo actualizar la factura');
        this.isSaving = false;
      }
    });
  }

  deleteInvoice(invoice: any): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la factura "${invoice.invoiceNumber}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/invoices/${invoice._id}`).subscribe({
          next: () => {
            this.notificationService.success('Éxito', 'Factura eliminada');
            this.loadInvoices();
          },
          error: () => {
            this.notificationService.error('Error', 'No se pudo eliminar la factura');
          }
        });
      }
    });
  }

  downloadPdf(id: string, fileName: string): void {
    this.http.get<any>(`${environment.apiUrl}/invoices/${id}/file-url?mode=download`).subscribe({
      next: (response) => {
        const link = document.createElement('a');
        link.href = response.url;
        link.download = fileName || 'factura.pdf';
        link.click();
        this.notificationService.success('Éxito', 'Descargando PDF');
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo descargar el PDF');
      }
    });
  }

  closeDialog(): void {
    this.showDialog = false;
    this.currentInvoiceId = null;
    this.invoiceForm.reset({
      currency: 'USD',
      status: 'PENDING',
      subtotal: 0,
      tax: 0,
      total: 0
    });
  }

  getSupplierName(supplierId: any): string {
    if (!supplierId) return '-';
    if (typeof supplierId === 'object' && supplierId.name) {
      return supplierId.name;
    }
    const supplier = this.suppliers().find(s => s._id === supplierId);
    return supplier?.name || '-';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.severity as any || 'secondary';
  }
}
