import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DestinationExpense } from '../../../../types/settlement.types';

@Component({
    selector: 'app-settlement-destination-expenses',
    standalone: true,
    imports: [CommonModule, FormsModule, InputNumberModule, InputTextModule, ButtonModule, CardModule, TableModule],
    template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="flex items-center justify-between px-5 pt-4">
          <div class="flex items-center gap-2">
            <i class="pi pi-map-marker text-xl text-orange-500"></i>
            <h3 class="text-lg font-bold m-0">Gastos en Destino</h3>
          </div>
          <p-button
            icon="pi pi-plus"
            label="Agregar"
            size="small"
            [outlined]="true"
            (onClick)="addExpense()" />
        </div>
      </ng-template>

      <p-table [value]="expenses" styleClass="p-datatable-sm" *ngIf="expenses.length > 0">
        <ng-template pTemplate="header">
          <tr>
            <th style="width:50%">Concepto</th>
            <th style="width:35%">Valor</th>
            <th style="width:15%">Acción</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-expense let-i="rowIndex">
          <tr>
            <td>
              <input pInputText [(ngModel)]="expense.concepto"
                (change)="onChanged()" placeholder="Ej: Transporte interno"
                [style]="{'width':'100%'}" />
            </td>
            <td>
              <p-inputNumber [(ngModel)]="expense.valor"
                mode="currency" currency="USD" locale="es-US"
                [style]="{'width':'100%'}"
                (onInput)="onChanged()" (onBlur)="onChanged()"
                placeholder="0.00" />
            </td>
            <td>
              <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small"
                (onClick)="removeExpense(i)" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="footer">
          <tr class="font-bold">
            <td class="text-right">Total Gastos en Destino:</td>
            <td class="text-right text-lg text-orange-700">
              {{ totalExpenses | currency:'USD':'symbol':'1.2-2' }}
            </td>
            <td></td>
          </tr>
        </ng-template>
      </p-table>

      <div *ngIf="expenses.length === 0" class="text-center py-4 text-surface-400">
        <i class="pi pi-inbox text-2xl mb-2"></i>
        <p class="text-sm">No hay gastos en destino. Haga clic en "Agregar" para añadir.</p>
      </div>
    </p-card>
  `
})
export class SettlementDestinationExpensesComponent {
    @Input() expenses: DestinationExpense[] = [];
    @Output() expensesChange = new EventEmitter<DestinationExpense[]>();

    get totalExpenses(): number {
        return this.expenses.reduce((sum, e) => sum + (e.valor || 0), 0);
    }

    addExpense(): void {
        this.expenses.push({ concepto: '', valor: 0 });
        this.onChanged();
    }

    removeExpense(index: number): void {
        this.expenses.splice(index, 1);
        this.onChanged();
    }

    onChanged(): void {
        this.expensesChange.emit([...this.expenses]);
    }
}
