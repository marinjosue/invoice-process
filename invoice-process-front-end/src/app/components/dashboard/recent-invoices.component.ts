import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

export interface RecentInvoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  status: string;
  currency: string;
  supplierName: string;
  supplierId?: {
    _id: string;
    name: string;
  };
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalLine: number;
  }>;
}

@Component({
  selector: 'app-recent-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TableModule, TagModule, ButtonModule],
  template: `
    <p-card styleClass="surface-card shadow-3 border-round-xl">
      <ng-template pTemplate="header">
        <div class="p-4 pb-2 flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3">
          <div class="flex-1">
            <h3 class="text-lg md:text-xl font-bold flex align-items-center mb-1 mt-0">
              <i class="pi pi-file-pdf text-blue-500 mr-2 text-xl"></i>
              Facturas Recientes
            </h3>
            <p class="text-600 text-sm mt-1 mb-0">
              Últimas {{ invoices.length || 0 }} facturas procesadas
            </p>
          </div>
          <p-button 
            label="Ver todas" 
            [text]="true" 
            icon="pi pi-arrow-right" 
            iconPos="right"
            routerLink="/invoices/management"
            styleClass="p-button-outlined p-button-sm"
            size="small"
          />
        </div>
      </ng-template>
      
      @if (invoices && invoices.length > 0) {
        <div class="table-responsive">
          <p-table 
            [value]="invoices" 
            styleClass="p-datatable-sm p-datatable-striped"
            responsiveLayout="scroll"
            [tableStyle]="{'min-width': '100%'}"
          >
            <ng-template pTemplate="header">
              <tr>
                <th class="font-semibold text-700 text-sm" style="min-width: 120px;">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-hashtag text-xs"></i>
                    <span>Número</span>
                  </div>
                </th>
                <th class="font-semibold text-700 text-sm hidden sm:table-cell" style="min-width: 180px;">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-building text-xs"></i>
                    <span>Proveedor</span>
                  </div>
                </th>
                <th class="font-semibold text-700 text-sm hidden md:table-cell" style="min-width: 120px;">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-calendar text-xs"></i>
                    <span>Fecha</span>
                  </div>
                </th>
                <th class="text-right font-semibold text-700 text-sm" style="min-width: 100px;">
                  <div class="flex align-items-center justify-content-end gap-2">
                    <i class="pi pi-dollar text-xs"></i>
                    <span>Monto</span>
                  </div>
                </th>
                <th class="text-center font-semibold text-700 text-sm" style="min-width: 100px;">
                  <div class="flex align-items-center justify-content-center gap-2">
                    <i class="pi pi-flag text-xs"></i>
                    <span>Estado</span>
                  </div>
                </th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-invoice>
              <tr class="hover:surface-100 transition-colors transition-duration-200">
                <td class="font-mono text-sm font-semibold">
                  {{ invoice.invoiceNumber }}
                </td>
                <td class="hidden sm:table-cell">
                  <div class="flex align-items-center gap-2">
                    <div class="w-2rem h-2rem bg-blue-100 border-round-2xl flex align-items-center justify-content-center flex-shrink-0">
                      <i class="pi pi-building text-blue-600 text-xs"></i>
                    </div>
                    <span class="font-medium text-900 text-sm">{{ invoice.supplierName || invoice.supplierId?.name || 'Sin asignar' }}</span>
                  </div>
                </td>
                <td class="text-600 text-sm hidden md:table-cell">
                  {{ invoice.invoiceDate | date:'dd/MM/yyyy' }}
                </td>
                <td class="text-right">
                  <span class="font-bold text-green-600 text-sm">
                    {{ invoice.total | currency:invoice.currency:'symbol':'1.2-2' }}
                  </span>
                </td>
                <td class="text-center">
                  <p-tag 
                    [value]="getStatusLabel(invoice.status)" 
                    [severity]="getStatusSeverity(invoice.status)"
                    [icon]="getStatusIcon(invoice.status)"
                    styleClass="text-xs"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      } @else {
        <div class="text-center py-6">
          <div class="w-4rem h-4rem surface-100 border-round-3xl flex align-items-center justify-content-center mx-auto mb-4">
            <i class="pi pi-inbox text-3xl text-400"></i>
          </div>
          <h4 class="text-base md:text-lg font-semibold text-600 mb-2 mt-0">
            No hay facturas recientes
          </h4>
          <p class="text-500 mb-4 text-sm">
            Las facturas procesadas aparecerán aquí
          </p>
          <p-button 
            label="Subir nueva factura" 
            icon="pi pi-plus"
            routerLink="/invoices/upload"
            size="small"
          />
        </div>
      }
    </p-card>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
      -webkit-overflow-scrolling: touch;
    }

    :host ::ng-deep .p-datatable {
      width: 100%;
    }

    :host ::ng-deep .p-datatable-striped .p-datatable-tbody tr:nth-child(even) {
      background: var(--surface-50);
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      padding: 0.75rem 0.5rem;
      white-space: nowrap;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 0.75rem 0.5rem;
    }

    @media (min-width: 768px) {
      :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
        padding: 1rem;
      }

      :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
        padding: 1rem;
      }
    }

    :host ::ng-deep .p-card-header {
      padding: 1rem;
    }

    @media (min-width: 768px) {
      :host ::ng-deep .p-card-header {
        padding: 1.25rem;
      }
    }
  `]
})
export class RecentInvoicesComponent {
  @Input() invoices: RecentInvoice[] = [];

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    const severityMap: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
      'FINALIZED': 'success',
      'VALIDATED': 'success',
      'PENDING': 'warn',
      'PROCESSING': 'info',
      'EXTRACTED': 'info',
      'ERROR': 'danger'
    };
    return severityMap[status?.toUpperCase()] || 'info';
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      'FINALIZED': 'Finalizada',
      'VALIDATED': 'Validada',
      'PENDING': 'Pendiente',
      'PROCESSING': 'Procesando',
      'EXTRACTED': 'Extraída',
      'ERROR': 'Error'
    };
    return labelMap[status?.toUpperCase()] || status;
  }

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      'FINALIZED': 'pi pi-check-circle',
      'VALIDATED': 'pi pi-check',
      'PENDING': 'pi pi-clock',
      'PROCESSING': 'pi pi-spin pi-spinner',
      'EXTRACTED': 'pi pi-file',
      'ERROR': 'pi pi-times-circle'
    };
    return iconMap[status?.toUpperCase()] || 'pi pi-info-circle';
  }
}
