import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { SettlementLineCalc } from '../../../../types/settlement.types';

@Component({
  selector: 'app-settlement-calc-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, InputNumberModule, TooltipModule],
  template: `
    <div class="settlement-calc-table">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-table text-xl text-primary-500"></i>
        <h3 class="text-lg font-bold m-0">Tabla de Cálculo ({{ rows.length }} items)</h3>
      </div>

      <div class="overflow-x-auto border border-surface-200 rounded-lg">
        <table class="w-full text-sm border-collapse min-w-[2200px]">
          <!-- Group Headers -->
          <thead>
            <tr class="text-xs">
              <th colspan="5" class="bg-surface-100 text-surface-700 text-center py-2 px-2 border border-surface-200 font-semibold">Base</th>
              <th colspan="3" class="bg-blue-50 text-blue-800 text-center py-2 px-2 border border-surface-200 font-semibold">Costos Importación</th>
              <th colspan="4" class="bg-orange-50 text-orange-800 text-center py-2 px-2 border border-surface-200 font-semibold">Impuestos</th>
              <th colspan="3" class="bg-green-50 text-green-800 text-center py-2 px-2 border border-surface-200 font-semibold">Costos</th>
              <th colspan="5" class="bg-purple-50 text-purple-800 text-center py-2 px-2 border border-surface-200 font-semibold">Precio y Margen</th>
            </tr>
            <!-- Column Headers -->
            <tr class="text-xs text-surface-600 bg-surface-50">
              <th class="py-2 px-2 border border-surface-200 text-left min-w-[180px]">Descripción</th>
              <th class="py-2 px-2 border border-surface-200 text-center min-w-[60px]">Cant.</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[85px]">P.Unit.</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[95px]">Total</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[65px]">%Dist.</th>

              <th class="py-2 px-2 border border-surface-200 text-right min-w-[90px] bg-blue-50/50">Flete</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[90px] bg-blue-50/50">Seguro</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[100px] bg-blue-50/50 font-semibold">CIF</th>

              <th class="py-2 px-2 border border-surface-200 text-center min-w-[75px] bg-orange-50/50" pTooltip="Editable">%Aran. ✏️</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[90px] bg-orange-50/50">Arancel</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[90px] bg-orange-50/50">FODINFA</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[90px] bg-orange-50/50">ISD</th>

              <th class="py-2 px-2 border border-surface-200 text-right min-w-[100px] bg-green-50/50 font-semibold">Costo Total</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[100px] bg-green-50/50" pTooltip="Editable">C.Vent/Ind ✏️</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[110px] bg-green-50/50 font-semibold">V.U.Planta</th>

              <th class="py-2 px-2 border border-surface-200 text-center min-w-[80px] bg-purple-50/50" pTooltip="Editable">%Incr. ✏️</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[100px] bg-purple-50/50 font-semibold">PVP Sug.</th>
              <th class="py-2 px-2 border border-surface-200 text-center min-w-[75px] bg-purple-50/50">%C.Venta</th>
              <th class="py-2 px-2 border border-surface-200 text-right min-w-[95px] bg-purple-50/50">Ganancia</th>
              <th class="py-2 px-2 border border-surface-200 text-center min-w-[75px] bg-purple-50/50">%Contrib.</th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody>
            <tr *ngFor="let row of rows; let i = index; trackBy: trackByIndex"
                class="hover:bg-surface-50 transition-colors">
              <td class="py-1.5 px-2 border border-surface-100 text-left font-medium text-surface-800 truncate max-w-[200px]"
                  [pTooltip]="row.description">{{ row.description }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-center">{{ row.quantity | number:'1.0-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-right">{{ row.unitPrice | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-right font-medium">{{ row.total | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-right">{{ row.distributionPct | number:'1.1-1' }}%</td>

              <td class="py-1.5 px-2 border border-surface-100 text-right bg-blue-50/30">{{ row.flete | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-right bg-blue-50/30">{{ row.seguro | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-right bg-blue-50/30 font-semibold">{{ row.cif | currency:'USD':'symbol':'1.2-2' }}</td>

              <!-- Editable: % Arancel -->
              <td class="py-0.5 px-1 border border-surface-100 bg-yellow-50/50">
                <p-inputNumber
                  [(ngModel)]="row.arancelPct"
                  suffix="%"
                  inputStyleClass="text-xs p-1 w-full text-center"
                  [style]="{'width':'100%'}"
                  (onInput)="onRowChanged()"
                  (onBlur)="onRowChanged()" />
              </td>
              <td class="py-1.5 px-2 border border-surface-100 text-right bg-orange-50/30">{{ row.arancel | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-right bg-orange-50/30">{{ row.fodinfa | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-right bg-orange-50/30">{{ row.isd | currency:'USD':'symbol':'1.2-2' }}</td>

              <td class="py-1.5 px-2 border border-surface-100 text-right bg-green-50/30 font-semibold">{{ row.costoTotal | currency:'USD':'symbol':'1.2-2' }}</td>
              <!-- Editable: Costo Ventas/Indirectos -->
              <td class="py-0.5 px-1 border border-surface-100 bg-yellow-50/50">
                <p-inputNumber
                  [(ngModel)]="row.costoVentasIndirectos"
                  mode="currency" currency="USD"
                  inputStyleClass="text-xs p-1 w-full text-right"
                  [style]="{'width':'100%'}"
                  (onInput)="onRowChanged()"
                  (onBlur)="onRowChanged()" />
              </td>
              <td class="py-1.5 px-2 border border-surface-100 text-right bg-green-50/30 font-bold text-green-800">{{ row.valorUnitarioPlanta | currency:'USD':'symbol':'1.2-2' }}</td>

              <!-- Editable: % Incremento -->
              <td class="py-0.5 px-1 border border-surface-100 bg-yellow-50/50">
                <p-inputNumber
                  [(ngModel)]="row.incrementoPct"
                  suffix="%"
                  inputStyleClass="text-xs p-1 w-full text-center"
                  [style]="{'width':'100%'}"
                  (onInput)="onRowChanged()"
                  (onBlur)="onRowChanged()" />
              </td>
              <td class="py-1.5 px-2 border border-surface-100 text-right bg-purple-50/30 font-bold">{{ row.pvpSugerido | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-center"
                  [ngClass]="{'text-red-600 font-bold': row.costoVentaPct > 0.41, 'text-green-600': row.costoVentaPct <= 0.41}">
                {{ row.costoVentaPct | percent:'1.0-0' }}
              </td>
              <td class="py-1.5 px-2 border border-surface-100 text-right text-cyan-700 font-medium">{{ row.ganancia | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-1.5 px-2 border border-surface-100 text-center">{{ row.contribucionPct | number:'1.2-2' }}</td>
            </tr>
          </tbody>

          <!-- Footer Totals -->
          <tfoot *ngIf="rows.length > 0">
            <tr class="font-bold bg-surface-100 text-sm">
              <td class="py-2 px-2 border border-surface-200 text-right" colspan="3">TOTALES:</td>
              <td class="py-2 px-2 border border-surface-200 text-right">{{ sumCol('total') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right">100%</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-blue-50">{{ sumCol('flete') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-blue-50">{{ sumCol('seguro') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-blue-50">{{ sumCol('cif') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-orange-50"></td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-orange-50">{{ sumCol('arancel') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-orange-50">{{ sumCol('fodinfa') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-orange-50">{{ sumCol('isd') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-green-50">{{ sumCol('costoTotal') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200 text-right bg-green-50">{{ sumCol('costoVentasIndirectos') | currency:'USD':'symbol':'1.2-2' }}</td>
              <td class="py-2 px-2 border border-surface-200" colspan="6"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div *ngIf="rows.length === 0" class="text-center py-8 text-surface-400">
        <i class="pi pi-inbox text-4xl mb-2"></i>
        <p>No hay items. Agregue facturas para ver los cálculos.</p>
      </div>
    </div>
  `
})
export class SettlementCalcTableComponent {
  @Input() rows: SettlementLineCalc[] = [];
  @Output() changed = new EventEmitter<void>();

  trackByIndex(index: number): number {
    return index;
  }

  onRowChanged(): void {
    this.changed.emit();
  }

  sumCol(field: keyof SettlementLineCalc): number {
    return this.rows.reduce((sum, row) => sum + ((row[field] as number) || 0), 0);
  }
}
