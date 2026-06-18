import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [CommonModule, CardModule, CurrencyPipe],
  template: `
    <p-card>
      <div class="flex flex-col gap-2">
        <div class="flex justify-between">
          <span class="text-surface-600 dark:text-surface-400">Subtotal:</span>
          <span class="font-medium">{{ subtotal | currency }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-surface-600 dark:text-surface-400">IVA ({{ taxRate }}%):</span>
          <span class="font-medium">{{ tax | currency }}</span>
        </div>
        <div class="border-t border-surface-200 dark:border-surface-700 pt-2 mt-2"></div>
        <div class="flex justify-between">
          <span class="text-xl font-bold text-surface-900 dark:text-surface-0">Total:</span>
          <span class="text-xl font-bold text-primary">{{ total | currency }}</span>
        </div>
      </div>
    </p-card>
  `,
  styles: [`
    :host {
      display: block;
      margin-top: 1rem;
    }
  `]
})
export class InvoiceSummaryComponent {
  @Input() subtotal: number = 0;
  @Input() tax: number = 0;
  @Input() total: number = 0;
  @Input() taxRate: number = 19;
}
