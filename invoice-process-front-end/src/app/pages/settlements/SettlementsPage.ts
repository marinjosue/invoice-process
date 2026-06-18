import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { SettlementApiService } from '@/core/data/settlement-api.service';
import { NotificationService } from '@/shared/services/notification.service';
import { Settlement } from '../../../types/settlement.types';

@Component({
  selector: 'app-settlements-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Liquidaciones</h2>
        <p-button label="Nueva Liquidación" icon="pi pi-plus" (onClick)="createSettlement()" />
      </div>

      <p-table [value]="settlements()" [loading]="isLoading()" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Facturas</th>
            <th>Costos Adicionales</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-settlement>
          <tr class="cursor-pointer hover:bg-surface-50" (click)="viewSettlement(settlement._id!)">
            <td>{{ settlement._id }}</td>
            <td>
              <span *ngIf="settlement.userId && settlement.userId.username">
                {{ settlement.userId.username }}
              </span>
            </td>
            <td>{{ getInvoicesCount(settlement) }}</td>
            <td>{{ settlement.total_additional_costs | currency }}</td>
            <td>{{ settlement.generation_date | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>
              <p-tag [value]="getStatusLabel(settlement.status)" [severity]="getStatusSeverity(settlement.status)" />
            </td>
            <td (click)="$event.stopPropagation()">
              <p-button
                *ngIf="settlement.status === 'DRAFT'"
                icon="pi pi-check-circle"
                [text]="true"
                severity="success"
                (onClick)="finalizeSettlement(settlement)"
                pTooltip="Finalizar Liquidación"
                [disabled]="getInvoicesCount(settlement) === 0" />
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                (onClick)="viewSettlement(settlement._id!)"
                pTooltip="Editar"
                [disabled]="settlement.status === 'FINALIZED'" />
              <p-button
                icon="pi pi-eye"
                [text]="true"
                severity="info"
                (onClick)="viewSettlement(settlement._id!)"
                pTooltip="Ver detalles" />
              <p-button
                icon="pi pi-trash"
                [text]="true"
                severity="danger"
                (onClick)="deleteSettlement(settlement)"
                pTooltip="Eliminar"
                [disabled]="settlement.status === 'FINALIZED'" />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center">No hay liquidaciones registradas</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog />
  `
})
export class SettlementsPage implements OnInit {
  settlements = signal<Settlement[]>([]);
  isLoading = signal(false);

  constructor(
    private settlementApiService: SettlementApiService,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSettlements();
  }

  loadSettlements(): void {
    this.isLoading.set(true);
    this.settlementApiService.list().subscribe({
      next: (response) => {
        this.settlements.set(response.settlements || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar las liquidaciones');
        this.isLoading.set(false);
      }
    });
  }

  createSettlement(): void {
    this.router.navigate(['/settlements', 'new']);
  }

  viewSettlement(id: string): void {
    this.router.navigate(['/settlements', id]);
  }

  deleteSettlement(settlement: Settlement): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar esta liquidación?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.settlementApiService.delete(settlement._id!).subscribe({
          next: () => {
            this.notificationService.success('Éxito', 'Liquidación eliminada');
            this.loadSettlements();
          },
          error: () => {
            this.notificationService.error('Error', 'No se pudo eliminar la liquidación');
          }
        });
      }
    });
  }

  finalizeSettlement(settlement: Settlement): void {
    if (this.getInvoicesCount(settlement) === 0) {
      this.notificationService.warning('Advertencia', 'Debe tener al menos una factura para finalizar');
      return;
    }

    this.confirmationService.confirm({
      message: `
        <div class="mb-3">
          <p class="font-bold mb-2">¿Confirmas finalizar esta liquidación?</p>
          <p class="text-sm mb-1">Esta acción es <span class="text-red-500 font-semibold">IRREVERSIBLE</span>.</p>
        </div>
      `,
      header: 'Finalizar Liquidación',
      icon: 'pi pi-exclamation-circle',
      acceptLabel: 'Sí, Finalizar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      defaultFocus: 'reject',
      accept: () => {
        this.settlementApiService.finalize(settlement._id!).subscribe({
          next: (response) => {
            this.notificationService.success(
              'Liquidación Finalizada',
              `Productos: ${response.productsUpdated} • Movimientos: ${response.movementsCreated} • Total: $${response.totalCost.toFixed(2)}`
            );
            this.loadSettlements();
          },
          error: (error) => {
            const errorMsg = error?.error?.message || 'No se pudo finalizar la liquidación';
            this.notificationService.error('Error', errorMsg);
          }
        });
      }
    });
  }

  getInvoicesCount(settlement: Settlement): number {
    if (!settlement.invoices) return 0;
    return Array.isArray(settlement.invoices) ? settlement.invoices.length : 0;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'DRAFT': 'BORRADOR',
      'FINALIZED': 'FINALIZADO',
      'CANCELLED': 'CANCELADO'
    };
    return map[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'FINALIZED': 'success',
      'DRAFT': 'info',
      'CANCELLED': 'danger'
    };
    return map[status] || 'secondary';
  }
}
