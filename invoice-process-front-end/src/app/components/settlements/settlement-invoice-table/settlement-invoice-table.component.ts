import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-settlement-invoice-table',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TagModule,
        TooltipModule
    ],
    template: `
    <div>
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-bold flex items-center gap-2 m-0">
          <i class="pi pi-file-edit text-primary-500"></i>
          Facturas en la Liquidación ({{ invoices.length }})
        </h3>
      </div>

      <p-table
        [value]="invoices"
        dataKey="_id"
        [expandedRowKeys]="expandedRows"
        responsiveLayout="scroll"
        styleClass="p-datatable-sm">

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 3rem"></th>
            <th>Número</th>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Moneda</th>
            <th class="text-right">Subtotal</th>
            <th class="text-right">Impuesto</th>
            <th class="text-right">Total</th>
            <th style="width: 4rem" *ngIf="editable">Acción</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-invoice let-expanded="expanded">
          <tr>
            <td>
              <p-button
                type="button"
                [pRowToggler]="invoice"
                [text]="true"
                [rounded]="true"
                [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                size="small" />
            </td>
            <td>
              <strong>{{ invoice.invoiceNumber || 'Sin número' }}</strong>
            </td>
            <td>{{ invoice.invoiceDate | date:'dd/MM/yyyy' }}</td>
            <td>{{ getSupplierName(invoice) }}</td>
            <td>
              <p-tag [value]="invoice.currency || 'USD'" severity="info" />
            </td>
            <td class="text-right">{{ invoice.subtotal | currency:'USD':'symbol':'1.2-2' }}</td>
            <td class="text-right">{{ invoice.tax | currency:'USD':'symbol':'1.2-2' }}</td>
            <td class="text-right font-bold">{{ invoice.total | currency:'USD':'symbol':'1.2-2' }}</td>
            <td *ngIf="editable">
              <p-button
                icon="pi pi-times"
                [text]="true"
                [rounded]="true"
                severity="danger"
                size="small"
                (onClick)="onRemoveInvoice(invoice)"
                pTooltip="Quitar factura" />
            </td>
          </tr>
        </ng-template>

        <!-- Row Expansion: Line Items -->
        <ng-template pTemplate="rowexpansion" let-invoice>
          <tr>
            <td [attr.colspan]="editable ? 9 : 8">
              <div class="p-4 bg-surface-50 rounded-lg ml-6">
                <h4 class="text-sm font-semibold mb-3 flex items-center gap-2 text-surface-700">
                  <i class="pi pi-list text-xs"></i>
                  Items de la Factura ({{ getItems(invoice).length }})
                </h4>
                <table class="w-full text-sm" *ngIf="getItems(invoice).length > 0">
                  <thead>
                    <tr class="text-xs text-surface-500 border-b border-surface-200">
                      <th class="text-left py-2 pr-4">Descripción</th>
                      <th class="text-center py-2 px-4">Cant.</th>
                      <th class="text-right py-2 px-4">P. Unitario</th>
                      <th class="text-right py-2 pl-4">Total Línea</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of getItems(invoice)" class="border-b border-surface-100">
                      <td class="py-2 pr-4">{{ item.description || item.descripcion || '-' }}</td>
                      <td class="text-center py-2 px-4">{{ item.quantity || item.cantidad || 0 }}</td>
                      <td class="text-right py-2 px-4">
                        {{ (item.unitPrice || item.precioUnitario || 0) | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                      <td class="text-right py-2 pl-4 font-medium">
                        {{ getItemTotal(item) | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p *ngIf="getItems(invoice).length === 0" class="text-surface-400 text-sm italic">
                  No hay items detallados para esta factura.
                </p>
              </div>
            </td>
          </tr>
        </ng-template>

        <!-- Footer -->
        <ng-template pTemplate="footer">
          <tr class="font-bold">
            <td [attr.colspan]="editable ? 7 : 6" class="text-right">Total Base:</td>
            <td class="text-right text-lg text-primary-700">
              {{ calculatedBaseTotal | currency:'USD':'symbol':'1.2-2' }}
            </td>
            <td *ngIf="editable"></td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="editable ? 9 : 8" class="text-center py-8">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-inbox text-4xl text-surface-300"></i>
                <p class="text-surface-500">No hay facturas agregadas a esta liquidación</p>
                <small class="text-surface-400">Use el selector de arriba para agregar facturas</small>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class SettlementInvoiceTableComponent {
    @Input() invoices: any[] = [];
    @Input() editable: boolean = true;

    @Output() removeInvoice = new EventEmitter<any>();

    expandedRows: { [key: string]: boolean } = {};

    get calculatedBaseTotal(): number {
        return this.invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    }

    getSupplierName(invoice: any): string {
        if (!invoice.supplierId) return '-';
        if (typeof invoice.supplierId === 'object' && invoice.supplierId.name) {
            return invoice.supplierId.name;
        }
        return '-';
    }

    getItems(invoice: any): any[] {
        // Items can come from extractedJson or from the invoice's items array
        if (invoice.extractedJson?.items && invoice.extractedJson.items.length > 0) {
            return invoice.extractedJson.items;
        }
        if (invoice.items && Array.isArray(invoice.items)) {
            return invoice.items;
        }
        return [];
    }

    getItemTotal(item: any): number {
        const qty = item.quantity || item.cantidad || 0;
        const price = item.unitPrice || item.precioUnitario || 0;
        return item.totalLinea || item.totalPrice || (qty * price);
    }

    onRemoveInvoice(invoice: any): void {
        this.removeInvoice.emit(invoice);
    }
}
