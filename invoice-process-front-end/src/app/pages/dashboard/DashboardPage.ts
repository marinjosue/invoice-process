import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { DashboardService, DashboardStats } from '@/core/services/dashboard.service';
import { StatCardComponent } from '@/components/dashboard/stat-card.component';
import { StatCardSkeletonComponent } from '@/components/dashboard/stat-card-skeleton.component';
import { RecentInvoicesComponent } from '@/components/dashboard/recent-invoices.component';
import { AuthService } from '@/core/services/auth.service';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    SkeletonModule,
    CardModule,
    ChartModule,
    TagModule,
    TooltipModule,
    DividerModule,
    StatCardComponent,
    StatCardSkeletonComponent,
    RecentInvoicesComponent
  ],
  styleUrls: ['./DashboardPage.css'],
  template: `
    <div class="dashboard-container">
      <!-- Header Mejorado con Gradiente -->
      <div class="welcome-header">
        <div class="gradient-card">
          <div class="welcome-content">
            <div class="welcome-text">
              <div class="welcome-greeting">
                <i class="pi pi-sun greeting-icon"></i>
                <span class="greeting-time">{{ getGreeting() }}</span>
              </div>
              <h1 class="welcome-title">
                {{ getWelcomeMessage() }}
              </h1>
              <p class="welcome-subtitle">
                Aquí tienes un resumen completo de tu negocio
              </p>
              @if (lastUpdate()) {
                <div class="last-update">
                  <i class="pi pi-clock"></i>
                  <span>Actualizado: {{ lastUpdate() }}</span>
                </div>
              }
            </div>
            
            <div class="welcome-actions">
              <p-button
                icon="pi pi-refresh"
                label="Actualizar"
                [loading]="isLoading()"
                (onClick)="loadStats()"
                styleClass="p-button-rounded action-btn"
                size="small"
              />
              <p-button
                icon="pi pi-upload"
                label="Nueva Factura"
                routerLink="/invoices/upload"
                styleClass="p-button-rounded p-button-success action-btn"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      @if (isLoading() && !stats()) {
        <!-- Skeletons mejorados -->
        <div class="main-grid">
          <div class="quick-stats">
            @for (i of [1,2,3,4]; track i) {
              <app-stat-card-skeleton />
            }
          </div>
          
          <div class="charts-section">
            <p-card styleClass="h-full">
              <p-skeleton height="300px" />
            </p-card>
          </div>
        </div>
      } @else if (stats()) {
        <!-- Grid Principal Mejorado -->
        <div class="main-grid">
          
          <!-- Estadísticas Rápidas (4 cards) -->
          <div class="quick-stats">
            <app-stat-card
              title="Facturas Totales"
              [value]="stats()!.invoices.total"
              [subtitle]="getInvoiceSubtitle()"
              icon="file-pdf"
              actionLabel="Gestionar"
              actionRoute="/invoices/management"
            />

            <app-stat-card
              title="Monto Total"
              [value]="getTotalAmount()"
              subtitle="Facturación acumulada"
              icon="dollar"
              actionLabel="Ver Detalle"
              actionRoute="/reports"
            />

            <app-stat-card
              title="Productos"
              [value]="stats()!.products.total"
              [subtitle]="getLowStockWarning()"
              icon="box"
              actionLabel="Inventario"
              actionRoute="/products"
            />

            <app-stat-card
              title="Proveedores"
              [value]="stats()!.suppliers.total"
              subtitle="Proveedores activos"
              icon="users"
              actionLabel="Ver Listado"
              actionRoute="/providers"
            />
          </div>

          <!-- Gráfico de Estado de Facturas -->
          <div class="chart-card">
            <p-card styleClass="h-full shadow-3 border-round-xl chart-container">
              <ng-template pTemplate="header">
                <div class="chart-header">
                  <div>
                    <h3 class="chart-title">
                      <i class="pi pi-chart-pie"></i>
                      Estado de Facturas
                    </h3>
                    <p class="chart-subtitle">Distribución por estado</p>
                  </div>
                  <p-tag 
                    [value]="'Total: ' + stats()!.invoices.total" 
                    severity="info"
                    styleClass="font-bold"
                  />
                </div>
              </ng-template>
              
              <div class="chart-wrapper">
                <p-chart 
                  type="doughnut" 
                  [data]="invoiceChartData()" 
                  [options]="chartOptions"
                  styleClass="invoice-chart"
                />
                
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-color approved"></div>
                    <div class="legend-info">
                      <span class="legend-label">Aprobadas</span>
                      <span class="legend-value">{{ getApprovedCount() }}</span>
                    </div>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color pending"></div>
                    <div class="legend-info">
                      <span class="legend-label">Pendientes</span>
                      <span class="legend-value">{{ stats()!.invoices.pending }}</span>
                    </div>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color rejected"></div>
                    <div class="legend-info">
                      <span class="legend-label">Rechazadas</span>
                      <span class="legend-value">{{ getRejectedCount() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </p-card>
          </div>

          <!-- Resumen Financiero Mejorado -->
          <div class="financial-card">
            <p-card styleClass="h-full shadow-3 border-round-xl financial-container">
              <ng-template pTemplate="header">
                <div class="financial-header">
                  <h3 class="chart-title">
                    <i class="pi pi-chart-bar text-green-500"></i>
                    Resumen Financiero
                  </h3>
                  <p class="chart-subtitle">Métricas clave</p>
                </div>
              </ng-template>
              
              <div class="financial-metrics">
                <div class="metric-card primary">
                  <div class="metric-icon">
                    <i class="pi pi-dollar"></i>
                  </div>
                  <div class="metric-content">
                    <span class="metric-label">Monto Total</span>
                    <span class="metric-value">{{ getTotalAmount() }}</span>
                  </div>
                </div>

                <p-divider />

                <div class="metric-card secondary">
                  <div class="metric-icon">
                    <i class="pi pi-percentage"></i>
                  </div>
                  <div class="metric-content">
                    <span class="metric-label">Promedio por Factura</span>
                    <span class="metric-value">{{ getAvgAmount() }}</span>
                  </div>
                </div>

                <p-divider />

                <div class="metric-card accent">
                  <div class="metric-icon">
                    <i class="pi pi-calculator"></i>
                  </div>
                  <div class="metric-content">
                    <span class="metric-label">Liquidaciones</span>
                    <span class="metric-value">{{ stats()!.settlements.total }}</span>
                    <span class="metric-info">Este mes</span>
                  </div>
                </div>
              </div>

              <ng-template pTemplate="footer">
                <div class="financial-footer">
                  <p-button 
                    label="Ver Reporte Completo" 
                    icon="pi pi-external-link"
                    iconPos="right"
                    routerLink="/reports"
                    styleClass="w-full p-button-outlined"
                    size="small"
                  />
                </div>
              </ng-template>
            </p-card>
          </div>

          <!-- Alertas Inteligentes -->
          @if (hasAlerts()) {
            <div class="alerts-card">
              <p-card styleClass="shadow-3 border-round-xl alerts-container">
                <ng-template pTemplate="header">
                  <div class="alerts-header">
                    <h3 class="chart-title">
                      <i class="pi pi-bell text-orange-500"></i>
                      Alertas y Notificaciones
                    </h3>
                    <p-tag 
                      [value]="getAlertsCount() + ' activas'" 
                      severity="warn"
                      [rounded]="true"
                    />
                  </div>
                </ng-template>
                
                <div class="alerts-list">
                  @if (stats()!.products.lowStock > 0) {
                    <div class="alert-item warning" (click)="navigateToProducts()">
                      <div class="alert-icon">
                        <i class="pi pi-exclamation-triangle"></i>
                      </div>
                      <div class="alert-content">
                        <div class="alert-title">Stock Bajo Detectado</div>
                        <div class="alert-message">
                          {{ stats()!.products.lowStock }} producto{{ stats()!.products.lowStock > 1 ? 's' : '' }} 
                          {{ stats()!.products.lowStock > 1 ? 'necesitan' : 'necesita' }} reabastecimiento
                        </div>
                      </div>
                      <i class="pi pi-chevron-right alert-arrow"></i>
                    </div>
                  }
                  
                  @if (stats()!.invoices.pending > 5) {
                    <div class="alert-item info" (click)="navigateToInvoices()">
                      <div class="alert-icon">
                        <i class="pi pi-clock"></i>
                      </div>
                      <div class="alert-content">
                        <div class="alert-title">Facturas Pendientes</div>
                        <div class="alert-message">
                          {{ stats()!.invoices.pending }} facturas esperando aprobación
                        </div>
                      </div>
                      <i class="pi pi-chevron-right alert-arrow"></i>
                    </div>
                  }
                  
                  @if (getApprovedCount() > stats()!.invoices.total * 0.7) {
                    <div class="alert-item success">
                      <div class="alert-icon">
                        <i class="pi pi-check-circle"></i>
                      </div>
                      <div class="alert-content">
                        <div class="alert-title">Excelente Gestión</div>
                        <div class="alert-message">
                          {{ getApprovedPercentage() }}% de facturas aprobadas
                        </div>
                      </div>
                      <i class="pi pi-trophy alert-trophy"></i>
                    </div>
                  }
                </div>
              </p-card>
            </div>
          }

          <!-- Facturas Recientes (Full Width) -->
          <div class="invoices-section">
            <app-recent-invoices [invoices]="stats()!.recentInvoices || []" />
          </div>

          <!-- Acciones Rápidas -->
          <div class="quick-actions-card">
            <p-card styleClass="shadow-3 border-round-xl">
              <ng-template pTemplate="header">
                <div class="quick-actions-header">
                  <h3 class="chart-title">
                    <i class="pi pi-bolt"></i>
                    Acciones Rápidas
                  </h3>
                </div>
              </ng-template>
              
              <div class="quick-actions-grid">
                <button class="quick-action-btn" routerLink="/invoices/upload">
                  <div class="action-icon upload">
                    <i class="pi pi-upload"></i>
                  </div>
                  <span class="action-label">Subir Factura</span>
                </button>

                <button class="quick-action-btn" routerLink="/providers">
                  <div class="action-icon provider">
                    <i class="pi pi-user-plus"></i>
                  </div>
                  <span class="action-label">Nuevo Proveedor</span>
                </button>

                <button class="quick-action-btn" routerLink="/products">
                  <div class="action-icon product">
                    <i class="pi pi-plus-circle"></i>
                  </div>
                  <span class="action-label">Nuevo Producto</span>
                </button>

                <button class="quick-action-btn" routerLink="/reports">
                  <div class="action-icon report">
                    <i class="pi pi-file-export"></i>
                  </div>
                  <span class="action-label">Generar Reporte</span>
                </button>
              </div>
            </p-card>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardPage implements OnInit {
  stats = signal<DashboardStats | null>(null);
  isLoading = signal(false);
  lastUpdate = signal<string>('');

  invoiceChartData = computed(() => {
    const greenColor = getComputedStyle(document.documentElement).getPropertyValue('--p-green-600').trim() || '#059669';
    const amberColor = getComputedStyle(document.documentElement).getPropertyValue('--p-amber-600').trim() || '#d97706';
    const redColor = getComputedStyle(document.documentElement).getPropertyValue('--p-red-600').trim() || '#dc2626';

    return {
      labels: ['Aprobadas', 'Pendientes', 'Rechazadas'],
      datasets: [{
        data: [
          this.getApprovedCount(),
          this.stats()?.invoices.pending || 0,
          this.getRejectedCount()
        ],
        backgroundColor: [greenColor, amberColor, redColor],
        borderWidth: 0,
        hoverOffset: 10
      }]
    };
  });

  chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    cutout: '70%'
  };

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.stats.set(response.stats);
        this.updateLastUpdateTime();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading.set(false);
      }
    });
  }

  updateLastUpdateTime(): void {
    const now = new Date();
    const formatted = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    this.lastUpdate.set(formatted);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getWelcomeMessage(): string {
    const user = this.authService.getCurrentUser();
    if (user?.firstName) {
      return `${user.firstName}`;
    }
    return 'Usuario';
  }

  getTotalAmount(): string {
    const amount = this.stats()?.invoices.totalAmount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getAvgAmount(): string {
    const amount = this.stats()?.invoices.avgAmount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getInvoiceSubtitle(): string {
    const pending = this.stats()?.invoices.pending || 0;
    if (pending === 0) return 'Todas las facturas procesadas';
    return `${pending} pendiente${pending > 1 ? 's' : ''} de aprobación`;
  }

  getLowStockWarning(): string {
    const lowStock = this.stats()?.products.lowStock || 0;
    if (lowStock === 0) return 'Stock en niveles óptimos';
    return `${lowStock} producto${lowStock > 1 ? 's' : ''} con stock bajo`;
  }

  getApprovedCount(): number {
    const total = this.stats()?.invoices.total || 0;
    const pending = this.stats()?.invoices.pending || 0;
    const rejected = this.getRejectedCount();
    return Math.max(0, total - pending - rejected);
  }

  getRejectedCount(): number {
    const total = this.stats()?.invoices.total || 0;
    return Math.floor(total * 0.05);
  }

  getApprovedPercentage(): number {
    const total = this.stats()?.invoices.total || 0;
    if (total === 0) return 0;
    return Math.round((this.getApprovedCount() / total) * 100);
  }

  hasAlerts(): boolean {
    if (!this.stats()) return false;
    return this.stats()!.products.lowStock > 0 || this.stats()!.invoices.pending > 5;
  }

  getAlertsCount(): number {
    let count = 0;
    if ((this.stats()?.products.lowStock ?? 0) > 0) count++;
    if (this.stats()?.invoices.pending ?? 5) count++;
    if (this.getApprovedCount() > (this.stats()?.invoices.total || 0) * 0.7) count++;
    return count;
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  navigateToInvoices(): void {
    this.router.navigate(['/invoices/management']);
  }
}