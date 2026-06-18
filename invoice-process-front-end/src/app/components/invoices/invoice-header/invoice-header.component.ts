import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  supplierId: any;
  date?: Date | string;
  invoiceDate?: Date | string;
  status: 'DRAFT' | 'EXTRACTED' | 'VALIDATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FINALIZED' | 'PROCESSING';
  subtotal: number;
  tax: number;
  total: number;
}

@Component({
  selector: 'app-invoice-header',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  template: `
    <p-card>
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
            Factura #{{ invoice.invoiceNumber }}
          </h2>
          <p class="text-surface-600 dark:text-surface-400">
            Proveedor: {{ getSupplierName() }}
          </p>
          @if (getInvoiceDate()) {
            <p class="text-surface-600 dark:text-surface-400">
              Fecha: {{ getInvoiceDate() | date: 'dd/MM/yyyy' }}
            </p>
          }
        </div>
        <div>
          <p-tag 
            [value]="getStatusLabel(invoice.status)" 
            [severity]="getStatusSeverity(invoice.status)"
          />
        </div>
      </div>
    </p-card>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 1rem;
    }
  `]
})
export class InvoiceHeaderComponent {
  @Input() invoice!: Invoice;

  getSupplierName(): string {
    if (!this.invoice.supplierId) return 'Sin proveedor';
    
    // Si supplierId es un objeto con nombre
    if (typeof this.invoice.supplierId === 'object' && this.invoice.supplierId.name) {
      return this.invoice.supplierId.name;
    }
    
    // Si es un string
    return String(this.invoice.supplierId);
  }

  getInvoiceDate(): Date | string | null {
    return this.invoice.invoiceDate || this.invoice.date || null;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'DRAFT': 'Borrador',
      'EXTRACTED': 'Datos Extraídos',
      'VALIDATED': 'Validado',
      'PROCESSING': 'Procesando',
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobada',
      'REJECTED': 'Rechazada',
      'FINALIZED': 'Finalizada'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      'DRAFT': 'info',
      'EXTRACTED': 'warn',
      'VALIDATED': 'info',
      'PROCESSING': 'warn',
      'PENDING': 'warn',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'FINALIZED': 'success'
    };
    return severities[status] || 'info';
  }
}
