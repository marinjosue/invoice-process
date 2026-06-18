import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { SettlementGlobalParams } from '../../../../types/settlement.types';

@Component({
  selector: 'app-settlement-global-params',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule, CardModule],
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="flex items-center gap-2 px-5 pt-4">
          <i class="pi pi-sliders-h text-xl text-primary-500"></i>
          <h3 class="text-lg font-bold m-0">Parámetros Globales</h3>
        </div>
      </ng-template>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Flete Total -->
        <div class="field">
          <label class="block text-sm font-medium mb-1">
            <i class="pi pi-truck text-xs text-blue-500 mr-1"></i>
            Flete Total
          </label>
          <p-inputNumber
            [(ngModel)]="params.fleteTotal"
            mode="currency" currency="USD" locale="es-US"
            [style]="{'width':'100%'}"
            (onInput)="onParamChange()"
            (onBlur)="onParamChange()"
            placeholder="0.00" />
        </div>

        <!-- Seguro Total -->
        <div class="field">
          <label class="block text-sm font-medium mb-1">
            <i class="pi pi-shield text-xs text-green-500 mr-1"></i>
            Seguro Total
          </label>
          <p-inputNumber
            [(ngModel)]="params.seguroTotal"
            mode="currency" currency="USD" locale="es-US"
            [style]="{'width':'100%'}"
            (onInput)="onParamChange()"
            (onBlur)="onParamChange()"
            placeholder="0.00" />
        </div>

        <!-- % Variación Flete -->
        <div class="field">
          <label class="block text-sm font-medium mb-1">
            <i class="pi pi-percentage text-xs text-orange-500 mr-1"></i>
            % Var. Flete
          </label>
          <p-inputNumber
            [(ngModel)]="params.variacionFletePct"
            suffix="%" [minFractionDigits]="1" [maxFractionDigits]="2"
            [style]="{'width':'100%'}"
            (onInput)="onParamChange()"
            (onBlur)="onParamChange()"
            placeholder="0" />
        </div>

        <!-- % FODINFA -->
        <div class="field">
          <label class="block text-sm font-medium mb-1">
            <i class="pi pi-percentage text-xs text-teal-500 mr-1"></i>
            % FODINFA
          </label>
          <p-inputNumber
            [(ngModel)]="params.fodinfaPct"
            suffix="%" [minFractionDigits]="1" [maxFractionDigits]="2"
            [style]="{'width':'100%'}"
            (onInput)="onParamChange()"
            (onBlur)="onParamChange()"
            placeholder="0.5" />
        </div>

        <!-- % ISD -->
        <div class="field">
          <label class="block text-sm font-medium mb-1">
            <i class="pi pi-money-bill text-xs text-red-500 mr-1"></i>
            % ISD
          </label>
          <p-inputNumber
            [(ngModel)]="params.isdPct"
            suffix="%" [minFractionDigits]="1" [maxFractionDigits]="2"
            [style]="{'width':'100%'}"
            (onInput)="onParamChange()"
            (onBlur)="onParamChange()"
            placeholder="5" />
        </div>

        <!-- % Incremento -->
        <div class="field">
          <label class="block text-sm font-medium mb-1">
            <i class="pi pi-arrow-up text-xs text-cyan-500 mr-1"></i>
            % Incremento (default)
          </label>
          <p-inputNumber
            [(ngModel)]="params.incrementoPct"
            suffix="%" [minFractionDigits]="0" [maxFractionDigits]="2"
            [style]="{'width':'100%'}"
            (onInput)="onParamChange()"
            (onBlur)="onParamChange()"
            placeholder="145" />
        </div>
      </div>
    </p-card>
  `
})
export class SettlementGlobalParamsComponent {
  @Input() params: SettlementGlobalParams = {
    fleteTotal: 0,
    seguroTotal: 0,
    variacionFletePct: 0,
    fodinfaPct: 0.5,
    isdPct: 5,
    incrementoPct: 145
  };

  @Output() paramsChange = new EventEmitter<SettlementGlobalParams>();

  onParamChange(): void {
    this.paramsChange.emit({ ...this.params });
  }
}
