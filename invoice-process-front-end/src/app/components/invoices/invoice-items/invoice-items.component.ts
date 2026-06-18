import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TableModule } from 'primeng/table';

export interface InvoiceItem {
  _id?: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
}

@Component({
  selector: 'app-invoice-items',
  standalone: true,
  imports: [CommonModule, TableModule, CurrencyPipe],
  template: `
    <p-table [value]="items" [tableStyle]="{ 'min-width': '50rem' }">
      <ng-template pTemplate="header">
        <tr>
          <th>SKU</th>
          <th>Descripción</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">Subtotal</th>
          <th class="text-right">IVA</th>
          <th class="text-right">Total</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-item>
        <tr>
          <td>{{ item.sku }}</td>
          <td>{{ item.description }}</td>
          <td class="text-right">{{ item.quantity }}</td>
          <td class="text-right">{{ item.unitPrice | currency }}</td>
          <td class="text-right">{{ item.subtotal | currency }}</td>
          <td class="text-right">{{ item.tax | currency }}</td>
          <td class="text-right font-bold">{{ item.total | currency }}</td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="7" class="text-center">No hay items en esta factura</td>
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    :host {
      display: block;
      margin: 1rem 0;
    }
  `]
})
export class InvoiceItemsComponent {
  @Input() items: InvoiceItem[] = [];
}
