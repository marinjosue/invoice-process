import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SettlementApiService } from '@/core/data/settlement-api.service';
import { NotificationService } from '@/shared/services/notification.service';
import { AuthService } from '@/core/services/auth.service';
import { environment } from '../../../environments/environment';
import {
  Settlement,
  SettlementGlobalParams,
  SettlementLineCalc,
  DestinationExpense,
  SettlementGlobalParamsDTO,
  CalculatedItemDTO,
  DestinationExpenseDTO,
  SettlementSummaryDTO
} from '../../../types/settlement.types';
import { SettlementGlobalParamsComponent } from '@/components/settlements/settlement-global-params/settlement-global-params.component';
import { SettlementCalcTableComponent } from '@/components/settlements/settlement-calc-table/settlement-calc-table.component';
import { SettlementDestinationExpensesComponent } from '@/components/settlements/settlement-destination-expenses/settlement-destination-expenses.component';

@Component({
  selector: 'app-settlement-detail-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, CardModule, TagModule,
    MultiSelectModule, ProgressSpinnerModule, DividerModule, ConfirmDialogModule,
    SettlementGlobalParamsComponent, SettlementCalcTableComponent, SettlementDestinationExpensesComponent
  ],
  providers: [ConfirmationService],
  template: `
    @if (isLoading()) {
      <div class="flex justify-center items-center" style="min-height:400px">
        <p-progressSpinner />
      </div>
    } @else if (settlement()) {
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div class="flex items-center gap-3">
          <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" (onClick)="goBack()" />
          <div>
            <h2 class="text-2xl font-bold m-0">{{ isNewMode ? 'Nueva Liquidación' : 'Liquidación' }}</h2>
            <small class="text-surface-500" *ngIf="!isNewMode">ID: {{ settlement()?._id }}</small>
          </div>
          <p-tag [value]="getStatusLabel(settlement()?.status || '')" [severity]="getStatusSeverity(settlement()?.status || '')" />
        </div>
        <div class="flex gap-2 flex-wrap">
          <p-button label="Guardar" icon="pi pi-save" [loading]="isSaving()" (onClick)="saveSettlement()"
            [disabled]="settlement()?.status === 'FINALIZED'" />
          <p-button label="Finalizar" icon="pi pi-check-circle" severity="success" (onClick)="finalizeSettlement()"
            [disabled]="settlement()?.status === 'FINALIZED' || calcRows.length === 0" *ngIf="!isNewMode" />
          <p-button label="Reporte PDF" icon="pi pi-print" severity="info" [outlined]="true"
            [loading]="isGeneratingReport()" (onClick)="generateReport()"
            [disabled]="isNewMode" *ngIf="!isNewMode" />
        </div>
      </div>

      <!-- Invoice Selector -->
      <p-card class="mb-5" *ngIf="settlement()?.status !== 'FINALIZED'">
        <ng-template pTemplate="header">
          <div class="flex items-center gap-2 px-5 pt-4">
            <i class="pi pi-file-edit text-xl text-green-500"></i>
            <h3 class="text-lg font-bold m-0">Facturas ({{ fullInvoices().length }} seleccionadas)</h3>
          </div>
        </ng-template>
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Facturas Validadas Disponibles</label>
            <p-multiSelect [(ngModel)]="selectedInvoiceIds" [options]="availableInvoices()"
              optionLabel="invoiceNumber" optionValue="_id" placeholder="Seleccionar facturas..."
              [filter]="true" filterBy="invoiceNumber" [showToggleAll]="true" appendTo="body"
              [style]="{'width':'100%'}">
              <ng-template let-inv pTemplate="item">
                <div class="flex justify-between w-full gap-4">
                  <span class="font-medium">{{ inv.invoiceNumber }}</span>
                  <span class="text-sm text-surface-500">{{ inv.total | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
              </ng-template>
            </p-multiSelect>
          </div>
          <p-button label="Agregar" icon="pi pi-plus" (onClick)="addSelectedInvoices()"
            [disabled]="selectedInvoiceIds.length === 0" />
        </div>
      </p-card>

      <!-- Global Parameters -->
      <div class="mb-5">
        <app-settlement-global-params [params]="globalParams" (paramsChange)="onGlobalParamsChange($event)" />
      </div>

      <!-- Calculation Table -->
      <div class="mb-5">
        <p-card>
          <app-settlement-calc-table [rows]="calcRows" (changed)="recalcAll()" />
        </p-card>
      </div>

      <!-- Gastos en Destino + Summary -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <app-settlement-destination-expenses [expenses]="destinationExpenses" (expensesChange)="onExpensesChange($event)" />

        <!-- Summary Card -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="flex items-center gap-2 px-5 pt-4">
              <i class="pi pi-chart-bar text-xl text-primary-500"></i>
              <h3 class="text-lg font-bold m-0">Resumen</h3>
            </div>
          </ng-template>
          <div class="flex flex-col gap-3">
            <div class="flex justify-between"><span class="text-surface-600">Total Base (FOB)</span>
              <span class="font-medium">{{ sumCalcCol('total') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <div class="flex justify-between"><span class="text-surface-600">Total Flete</span>
              <span>{{ sumCalcCol('flete') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <div class="flex justify-between"><span class="text-surface-600">Total Seguro</span>
              <span>{{ sumCalcCol('seguro') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <div class="flex justify-between font-medium"><span>Total CIF</span>
              <span>{{ sumCalcCol('cif') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <p-divider />
            <div class="flex justify-between"><span class="text-surface-600">Total Arancel</span>
              <span>{{ sumCalcCol('arancel') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <div class="flex justify-between"><span class="text-surface-600">Total FODINFA</span>
              <span>{{ sumCalcCol('fodinfa') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <div class="flex justify-between"><span class="text-surface-600">Total ISD</span>
              <span>{{ sumCalcCol('isd') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <p-divider />
            <div class="flex justify-between"><span class="text-surface-600">Total Costos</span>
              <span class="font-medium">{{ sumCalcCol('costoTotal') | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <div class="flex justify-between"><span class="text-surface-600">Gastos en Destino</span>
              <span>{{ totalDestinationExpenses | currency:'USD':'symbol':'1.2-2' }}</span></div>
            <div class="flex justify-between p-3 bg-primary-50 rounded-lg border border-primary-200 mt-2">
              <span class="text-base font-bold text-primary-800">GRAN TOTAL</span>
              <span class="text-xl font-bold text-primary-700">{{ grandTotal | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
          </div>
        </p-card>
      </div>

      <p-confirmDialog />
    }
  `
})
export class SettlementDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private settlementApiService = inject(SettlementApiService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);

  settlement = signal<Settlement | null>(null);
  fullInvoices = signal<any[]>([]);
  availableInvoices = signal<any[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isGeneratingReport = signal(false);

  selectedInvoiceIds: string[] = [];
  isNewMode = false;
  settlementId = '';

  globalParams: SettlementGlobalParams = {
    fleteTotal: 0, seguroTotal: 0, variacionFletePct: 10,
    fodinfaPct: 0.5, isdPct: 5, incrementoPct: 145
  };

  calcRows: SettlementLineCalc[] = [];
  destinationExpenses: DestinationExpense[] = [];
  private savedCalculatedItems: CalculatedItemDTO[] = [];

  get totalDestinationExpenses(): number {
    return this.destinationExpenses.reduce((s, e) => s + (e.valor || 0), 0);
  }

  get grandTotal(): number {
    return this.sumCalcCol('costoTotal') + this.sumCalcCol('isd')
      + this.sumCalcCol('costoVentasIndirectos') + this.totalDestinationExpenses;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === 'new') {
      this.isNewMode = true;
      this.createNewDraft();
    } else if (idParam) {
      this.settlementId = idParam;
      this.loadSettlement();
    }
    this.loadAvailableInvoices();
  }

  // --- Data Loading ---

  private createNewDraft(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id) { this.notificationService.error('Error', 'Usuario no autenticado'); this.router.navigate(['/settlements']); return; }
    this.isLoading.set(true);
    this.settlementApiService.create({ userId: user.id, invoices: [], total_additional_costs: 0, status: 'DRAFT' }).subscribe({
      next: (r) => { this.settlementId = r.settlement._id!; this.isNewMode = false; this.settlement.set(r.settlement); this.isLoading.set(false); this.router.navigate(['/settlements', this.settlementId], { replaceUrl: true }); },
      error: () => { this.notificationService.error('Error', 'No se pudo crear'); this.isLoading.set(false); this.router.navigate(['/settlements']); }
    });
  }

  private loadSettlement(): void {
    this.isLoading.set(true);
    this.settlementApiService.getById(this.settlementId).subscribe({
      next: (r) => {
        this.settlement.set(r.settlement);
        this.restoreSavedCalcData(r.settlement);
        const ids = this.getInvoiceIds(r.settlement);
        if (ids.length > 0) { this.loadFullInvoices(ids); } else { this.isLoading.set(false); }
      },
      error: () => { this.notificationService.error('Error', 'No se pudo cargar'); this.isLoading.set(false); this.router.navigate(['/settlements']); }
    });
  }

  private loadFullInvoices(invoiceIds: string[]): void {
    const reqs = invoiceIds.map(id => this.http.get<any>(`${environment.apiUrl}/invoices/${id}`));
    forkJoin(reqs).subscribe({
      next: (responses) => {
        this.fullInvoices.set(responses.map(r => r.invoice || r));
        this.extractLineItems();
        this.recalcAll();
        this.isLoading.set(false);
      },
      error: () => { this.notificationService.error('Error', 'No se pudieron cargar las facturas'); this.isLoading.set(false); }
    });
  }

  loadAvailableInvoices(): void {
    this.http.get<any>(`${environment.apiUrl}/invoices`).subscribe({
      next: (r) => this.availableInvoices.set((r.invoices || []).filter((i: any) => i.status === 'VALIDATED')),
      error: () => this.notificationService.error('Error', 'No se pudieron cargar facturas disponibles')
    });
  }

  // --- Invoice Management ---

  addSelectedInvoices(): void {
    if (!this.selectedInvoiceIds.length) return;
    const currentIds = new Set(this.fullInvoices().map(i => i._id));
    const newIds = this.selectedInvoiceIds.filter(id => !currentIds.has(id));
    if (!newIds.length) { this.selectedInvoiceIds = []; return; }

    const reqs = newIds.map(id => this.http.get<any>(`${environment.apiUrl}/invoices/${id}`));
    forkJoin(reqs).subscribe({
      next: (responses) => {
        const newInvs = responses.map(r => r.invoice || r);
        this.fullInvoices.set([...this.fullInvoices(), ...newInvs]);
        this.extractLineItems();
        this.recalcAll();
        this.selectedInvoiceIds = [];
        this.notificationService.success('Éxito', `${newInvs.length} factura(s) agregada(s)`);
      },
      error: () => this.notificationService.error('Error', 'No se pudieron cargar facturas')
    });
  }

  // --- Line Item Extraction ---

  private extractLineItems(): void {
    const rows: SettlementLineCalc[] = [];
    for (const inv of this.fullInvoices()) {
      const items = this.getInvoiceItems(inv);
      for (const item of items) {
        const qty = item.quantity || item.cantidad || 0;
        const price = item.unitPrice || item.precioUnitario || 0;
        const desc = item.description || item.descripcion || '';

        // Try to find saved per-line inputs for this item
        const saved = this.savedCalculatedItems.find(
          s => s.invoice_id === inv._id && s.description === desc
        );

        rows.push({
          invoiceId: inv._id,
          invoiceNumber: inv.invoiceNumber || '',
          description: desc,
          quantity: qty,
          unitPrice: price,
          total: qty * price,
          distributionPct: 0, flete: 0, seguro: 0, cif: 0,
          arancelPct: saved?.arancel_pct || 0,
          arancel: 0, fodinfa: 0, isd: 0,
          costoTotal: 0,
          costoVentasIndirectos: saved?.costo_ventas_indirectos || 0,
          valorUnitarioPlanta: 0,
          incrementoPct: saved?.incremento_pct ?? this.globalParams.incrementoPct,
          pvpSugerido: 0, costoVentaPct: 0, ganancia: 0, contribucionPct: 0
        });
      }
    }
    this.calcRows = rows;
  }

  private getInvoiceItems(inv: any): any[] {
    if (inv.extractedJson?.items?.length) return inv.extractedJson.items;
    if (Array.isArray(inv.items) && inv.items.length) return inv.items;
    // Fallback: create a single line from invoice totals
    return [{ description: inv.invoiceNumber || 'Factura', quantity: 1, unitPrice: inv.total || 0 }];
  }

  // --- Core Calculation Engine ---

  recalcAll(): void {
    const p = this.globalParams;
    const sumTotal = this.calcRows.reduce((s, r) => s + r.total, 0);

    for (const row of this.calcRows) {
      // Distribution
      row.distributionPct = sumTotal > 0 ? (row.total / sumTotal) * 100 : 0;
      // Import costs
      row.flete = (p.fleteTotal * row.distributionPct) / 100;
      row.seguro = (p.seguroTotal * row.distributionPct) / 100;
      const variacionFlete = (row.flete * p.variacionFletePct) / 100;
      row.cif = row.total + row.flete + row.seguro + variacionFlete;
      // Taxes
      row.arancel = (row.cif * (row.arancelPct || 0)) / 100;
      row.fodinfa = (row.cif * p.fodinfaPct) / 100;
      row.isd = (row.total * p.isdPct) / 100;
      // Costs
      row.costoTotal = row.cif + row.arancel + row.fodinfa;
      const totalCostWithExtras = row.costoTotal + row.isd + (row.costoVentasIndirectos || 0);
      row.valorUnitarioPlanta = row.quantity > 0 ? totalCostWithExtras / row.quantity : 0;
      // Pricing
      const incr = row.incrementoPct || 0;
      row.pvpSugerido = row.valorUnitarioPlanta * (1 + incr / 100);
      row.costoVentaPct = row.pvpSugerido > 0 ? row.valorUnitarioPlanta / row.pvpSugerido : 0;
      row.ganancia = row.pvpSugerido - row.valorUnitarioPlanta;
      row.contribucionPct = row.pvpSugerido > 0 ? row.ganancia / row.pvpSugerido : 0;
    }
  }

  onGlobalParamsChange(params: SettlementGlobalParams): void {
    this.globalParams = params;
    // Apply default increment to rows that haven't been custom-set
    this.recalcAll();
  }

  onExpensesChange(expenses: DestinationExpense[]): void {
    this.destinationExpenses = expenses;
  }

  // --- Save / Finalize ---

  private buildSavePayload(): any {
    const user = this.authService.getCurrentUser();
    const invoiceIds = this.fullInvoices().map(i => i._id);
    const totalAdditional = this.sumCalcCol('flete') + this.sumCalcCol('seguro')
      + this.sumCalcCol('arancel') + this.sumCalcCol('fodinfa') + this.sumCalcCol('isd')
      + this.sumCalcCol('costoVentasIndirectos') + this.totalDestinationExpenses;

    const global_params: SettlementGlobalParamsDTO = {
      flete_total: this.globalParams.fleteTotal || 0,
      seguro_total: this.globalParams.seguroTotal || 0,
      variacion_flete_pct: this.globalParams.variacionFletePct || 0,
      fodinfa_pct: this.globalParams.fodinfaPct || 0,
      isd_pct: this.globalParams.isdPct || 0,
      incremento_pct: this.globalParams.incrementoPct || 0
    };

    const calculated_items: CalculatedItemDTO[] = this.calcRows.map(r => ({
      invoice_id: r.invoiceId, invoice_number: r.invoiceNumber,
      description: r.description, quantity: r.quantity, unit_price: r.unitPrice,
      total_fob: r.total, distribution_pct: r.distributionPct,
      flete: r.flete, seguro: r.seguro, cif: r.cif,
      arancel_pct: r.arancelPct, arancel: r.arancel, fodinfa: r.fodinfa, isd: r.isd,
      costo_total: r.costoTotal, costo_ventas_indirectos: r.costoVentasIndirectos,
      valor_unitario_planta: r.valorUnitarioPlanta, incremento_pct: r.incrementoPct,
      pvp_sugerido: r.pvpSugerido, costo_venta_pct: r.costoVentaPct,
      ganancia: r.ganancia, contribucion_pct: r.contribucionPct
    }));

    const destination_expenses: DestinationExpenseDTO[] = this.destinationExpenses.map(e => ({
      description: e.concepto, amount: e.valor || 0
    }));

    const summary: SettlementSummaryDTO = {
      total_fob: this.sumCalcCol('total'), total_flete: this.sumCalcCol('flete'),
      total_seguro: this.sumCalcCol('seguro'), total_cif: this.sumCalcCol('cif'),
      total_arancel: this.sumCalcCol('arancel'), total_fodinfa: this.sumCalcCol('fodinfa'),
      total_isd: this.sumCalcCol('isd'), total_costos: this.sumCalcCol('costoTotal'),
      gastos_destino: this.totalDestinationExpenses, gran_total: this.grandTotal
    };

    return {
      userId: user?.id, invoices: invoiceIds,
      total_additional_costs: totalAdditional,
      status: this.settlement()?.status || 'DRAFT',
      global_params, calculated_items, destination_expenses, summary
    };
  }

  saveSettlement(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id) { this.notificationService.error('Error', 'Usuario no autenticado'); return; }
    this.isSaving.set(true);

    this.settlementApiService.update(this.settlementId, this.buildSavePayload()).subscribe({
      next: (r) => { this.settlement.set(r.settlement); this.notificationService.success('Éxito', 'Liquidación guardada'); this.isSaving.set(false); },
      error: () => { this.notificationService.error('Error', 'No se pudo guardar'); this.isSaving.set(false); }
    });
  }

  finalizeSettlement(): void {
    if (!this.calcRows.length) return;
    this.confirmationService.confirm({
      message: '<p class="font-bold mb-2">¿Confirmas finalizar esta liquidación?</p><p class="text-sm">Esta acción es <span class="text-red-500 font-semibold">IRREVERSIBLE</span>.</p>',
      header: 'Finalizar Liquidación', icon: 'pi pi-exclamation-circle',
      acceptLabel: 'Sí, Finalizar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success', defaultFocus: 'reject',
      accept: () => {
        this.isSaving.set(true);
        const payload = { ...this.buildSavePayload(), status: 'DRAFT' as const };
        this.settlementApiService.update(this.settlementId, payload).subscribe({
          next: () => {
            this.settlementApiService.finalize(this.settlementId).subscribe({
              next: (res) => {
                this.notificationService.success('Finalizada', `Productos: ${res.productsUpdated} • Movimientos: ${res.movementsCreated} • Total: $${res.totalCost.toFixed(2)}`);
                this.isSaving.set(false);
                this.loadSettlement();
              },
              error: (err) => { this.notificationService.error('Error', err?.error?.message || 'No se pudo finalizar'); this.isSaving.set(false); }
            });
          },
          error: () => { this.notificationService.error('Error', 'No se pudo guardar antes de finalizar'); this.isSaving.set(false); }
        });
      }
    });
  }

  // --- Report ---

  generateReport(): void {
    this.isGeneratingReport.set(true);
    this.settlementApiService.generateReport(this.settlementId).subscribe({
      next: (res) => {
        this.isGeneratingReport.set(false);
        if (res.signedUrl) {
          window.open(res.signedUrl, '_blank');
          this.notificationService.success('Reporte', 'PDF generado exitosamente');
        }
      },
      error: (err) => {
        this.isGeneratingReport.set(false);
        this.notificationService.error('Error', err?.error?.message || 'No se pudo generar el reporte');
      }
    });
  }

  // --- Helpers ---

  goBack(): void { this.router.navigate(['/settlements']); }

  private restoreSavedCalcData(s: Settlement): void {
    if (s.global_params) {
      this.globalParams = {
        fleteTotal: s.global_params.flete_total || 0,
        seguroTotal: s.global_params.seguro_total || 0,
        variacionFletePct: s.global_params.variacion_flete_pct || 0,
        fodinfaPct: s.global_params.fodinfa_pct || 0,
        isdPct: s.global_params.isd_pct || 0,
        incrementoPct: s.global_params.incremento_pct || 145
      };
    }
    if (s.destination_expenses?.length) {
      this.destinationExpenses = s.destination_expenses.map(e => ({
        concepto: e.description, valor: e.amount || 0
      }));
    }
    // Cache saved per-line data to merge after extractLineItems
    this.savedCalculatedItems = s.calculated_items || [];
  }

  sumCalcCol(field: keyof SettlementLineCalc): number {
    return this.calcRows.reduce((s, r) => s + ((r[field] as number) || 0), 0);
  }

  private getInvoiceIds(s: Settlement): string[] {
    if (!s.invoices || !Array.isArray(s.invoices)) return [];
    return s.invoices.map((inv: any) => typeof inv === 'string' ? inv : inv._id);
  }

  getStatusLabel(status: string): string {
    return { 'DRAFT': 'BORRADOR', 'FINALIZED': 'FINALIZADO', 'CANCELLED': 'CANCELADO' }[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return ({ 'FINALIZED': 'success', 'DRAFT': 'info', 'CANCELLED': 'danger' } as any)[status] || 'secondary';
  }
}
