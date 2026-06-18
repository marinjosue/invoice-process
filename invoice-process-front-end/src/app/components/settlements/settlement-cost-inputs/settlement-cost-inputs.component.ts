import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SettlementCostBreakdown } from '../../../../types/settlement.types';

@Component({
    selector: 'app-settlement-cost-inputs',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputNumberModule,
        CardModule,
        DividerModule
    ],
    template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="flex items-center gap-2 px-5 pt-4">
          <i class="pi pi-calculator text-xl text-primary-500"></i>
          <h3 class="text-lg font-bold m-0">Costos y Cálculos</h3>
        </div>
      </ng-template>

      <!-- Base Total (read-only) -->
      <div class="mb-5">
        <label class="block text-sm font-semibold text-surface-600 mb-1">Total Base (Facturas)</label>
        <div class="text-2xl font-bold text-primary-700">
          {{ baseTotal | currency:'USD':'symbol':'1.2-2' }}
        </div>
        <small class="text-surface-400">Suma de totales de facturas seleccionadas</small>
      </div>

      <p-divider />

      <h4 class="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
        <i class="pi pi-list text-sm"></i>
        Costos Adicionales
      </h4>

      <div class="flex flex-col gap-4">
        <!-- Taxes -->
        <div class="field">
          <label for="cost-taxes" class="block text-sm font-medium mb-1">
            <i class="pi pi-percentage text-xs text-orange-500 mr-1"></i>
            Impuestos / Aranceles
          </label>
          <p-inputNumber
            id="cost-taxes"
            [(ngModel)]="costs.taxes"
            mode="currency"
            currency="USD"
            locale="es-US"
            [style]="{'width': '100%'}"
            (onInput)="onCostChange()"
            (onBlur)="onCostChange()"
            placeholder="0.00" />
        </div>

        <!-- Logistics -->
        <div class="field">
          <label for="cost-logistics" class="block text-sm font-medium mb-1">
            <i class="pi pi-truck text-xs text-blue-500 mr-1"></i>
            Flete / Logística
          </label>
          <p-inputNumber
            id="cost-logistics"
            [(ngModel)]="costs.logistics"
            mode="currency"
            currency="USD"
            locale="es-US"
            [style]="{'width': '100%'}"
            (onInput)="onCostChange()"
            (onBlur)="onCostChange()"
            placeholder="0.00" />
        </div>

        <!-- Insurance -->
        <div class="field">
          <label for="cost-insurance" class="block text-sm font-medium mb-1">
            <i class="pi pi-shield text-xs text-green-500 mr-1"></i>
            Seguro
          </label>
          <p-inputNumber
            id="cost-insurance"
            [(ngModel)]="costs.insurance"
            mode="currency"
            currency="USD"
            locale="es-US"
            [style]="{'width': '100%'}"
            (onInput)="onCostChange()"
            (onBlur)="onCostChange()"
            placeholder="0.00" />
        </div>

        <!-- Customs -->
        <div class="field">
          <label for="cost-customs" class="block text-sm font-medium mb-1">
            <i class="pi pi-building text-xs text-purple-500 mr-1"></i>
            Aduanas
          </label>
          <p-inputNumber
            id="cost-customs"
            [(ngModel)]="costs.customs"
            mode="currency"
            currency="USD"
            locale="es-US"
            [style]="{'width': '100%'}"
            (onInput)="onCostChange()"
            (onBlur)="onCostChange()"
            placeholder="0.00" />
        </div>

        <!-- Other -->
        <div class="field">
          <label for="cost-other" class="block text-sm font-medium mb-1">
            <i class="pi pi-ellipsis-h text-xs text-surface-500 mr-1"></i>
            Otros
          </label>
          <p-inputNumber
            id="cost-other"
            [(ngModel)]="costs.other"
            mode="currency"
            currency="USD"
            locale="es-US"
            [style]="{'width': '100%'}"
            (onInput)="onCostChange()"
            (onBlur)="onCostChange()"
            placeholder="0.00" />
        </div>
      </div>

      <p-divider />

      <!-- Totals Summary -->
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <span class="text-sm text-surface-600">Total Costos Adicionales</span>
          <span class="text-lg font-semibold text-orange-600">
            {{ totalAdditionalCosts | currency:'USD':'symbol':'1.2-2' }}
          </span>
        </div>
        <div class="flex justify-between items-center p-3 bg-primary-50 rounded-lg border border-primary-200">
          <span class="text-base font-bold text-primary-800">GRAN TOTAL</span>
          <span class="text-xl font-bold text-primary-700">
            {{ grandTotal | currency:'USD':'symbol':'1.2-2' }}
          </span>
        </div>
      </div>
    </p-card>
  `
})
export class SettlementCostInputsComponent implements OnInit {
    @Input() baseTotal: number = 0;
    @Input() initialCosts: SettlementCostBreakdown | null = null;

    @Output() costsChange = new EventEmitter<{ breakdown: SettlementCostBreakdown; total: number }>();

    costs: SettlementCostBreakdown = {
        taxes: 0,
        logistics: 0,
        insurance: 0,
        customs: 0,
        other: 0
    };

    get totalAdditionalCosts(): number {
        return (this.costs.taxes || 0)
            + (this.costs.logistics || 0)
            + (this.costs.insurance || 0)
            + (this.costs.customs || 0)
            + (this.costs.other || 0);
    }

    get grandTotal(): number {
        return this.baseTotal + this.totalAdditionalCosts;
    }

    ngOnInit(): void {
        if (this.initialCosts) {
            this.costs = { ...this.initialCosts };
        }
    }

    onCostChange(): void {
        this.costsChange.emit({
            breakdown: { ...this.costs },
            total: this.totalAdditionalCosts
        });
    }
}
