import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NotificationService } from '@/shared/services/notification.service';
import { GlobalConfirmationService } from '@/shared/services/confirmation.service';
import { environment } from '../../../environments/environment';
import { ProviderFormDialogComponent, ProviderFormData } from '@/components/providers/provider-form-dialog.component';
import { ProviderListTableComponent, Supplier } from '@/components/providers/provider-list-table.component';

@Component({
  selector: 'app-providers-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmDialogModule,
    ProviderFormDialogComponent,
    ProviderListTableComponent
  ],
  template: `
    <p-confirmDialog />
    
    <app-provider-form-dialog
      [(visible)]="showDialog"
      [isEditMode]="isEditMode"
      [isSaving]="isSaving"
      [providerData]="currentProviderData"
      (save)="saveProvider($event)"
      (cancel)="closeDialog()"
    />
    
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Proveedores</h2>
        <p-button 
          label="Nuevo Proveedor" 
          icon="pi pi-plus"
          (onClick)="createProvider()" 
        />
      </div>

      <app-provider-list-table
        [suppliers]="filteredSuppliers()"
        [isLoading]="isLoading()"
        [(searchValue)]="searchTerm"
        (searchValueChange)="onSearch()"
        (edit)="editProvider($event)"
        (delete)="deleteProvider($event)"
      />
    </div>
  `
})
export class ProvidersPage implements OnInit {
  suppliers = signal<Supplier[]>([]);
  filteredSuppliers = signal<Supplier[]>([]);
  isLoading = signal(false);
  searchTerm = '';
  showDialog = false;
  isEditMode = false;
  isSaving = false;
  currentProviderId: string | null = null;
  currentProviderData: ProviderFormData | null = null;

  private apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private confirmationService: GlobalConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; suppliers: Supplier[] }>(this.apiUrl).subscribe({
      next: (response) => {
        this.suppliers.set(response.suppliers);
        this.filteredSuppliers.set(response.suppliers);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.notificationService.error('Error', 'No se pudieron cargar los proveedores');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredSuppliers.set(this.suppliers());
      return;
    }

    const filtered = this.suppliers().filter(supplier =>
      supplier.name.toLowerCase().includes(term) ||
      supplier.supplierId.toLowerCase().includes(term) ||
      (supplier.taxId && supplier.taxId.toLowerCase().includes(term)) ||
      (supplier.email && supplier.email.toLowerCase().includes(term))
    );
    this.filteredSuppliers.set(filtered);
  }

  createProvider(): void {
    this.isEditMode = false;
    this.currentProviderId = null;
    this.currentProviderData = null;
    this.showDialog = true;
  }

  editProvider(id: string): void {
    this.isEditMode = true;
    this.currentProviderId = id;
    
    // Cargar datos del proveedor
    this.http.get<{ success: boolean; supplier: Supplier }>(`${this.apiUrl}/${id}`).subscribe({
      next: (response) => {
        this.currentProviderData = {
          name: response.supplier.name,
          taxId: response.supplier.taxId,
          email: response.supplier.email,
          phone: response.supplier.phone,
          address: response.supplier.address,
          city: response.supplier.city,
          country: response.supplier.country,
          isActive: response.supplier.isActive
        };
        this.showDialog = true;
      },
      error: (error) => {
        console.error('Error loading supplier:', error);
        this.notificationService.error('Error', 'No se pudo cargar el proveedor');
      }
    });
  }

  closeDialog(): void {
    this.showDialog = false;
    this.currentProviderData = null;
    this.currentProviderId = null;
  }

  saveProvider(formData: ProviderFormData): void {
    this.isSaving = true;

    const request$ = this.isEditMode
      ? this.http.put(`${this.apiUrl}/${this.currentProviderId}`, formData)
      : this.http.post(this.apiUrl, formData);

    request$.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Proveedor actualizado' : 'Proveedor creado';
        this.notificationService.success('Éxito', message);
        this.closeDialog();
        this.loadProviders();
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving supplier:', error);
        this.notificationService.error('Error', 'No se pudo guardar el proveedor');
        this.isSaving = false;
      }
    });
  }

  deleteProvider(supplier: Supplier): void {
    this.confirmationService.confirmDelete({
      message: `¿Está seguro de eliminar el proveedor "${supplier.name}"? Esta acción no se puede deshacer.`,
      onAccept: () => {
        this.http.delete(`${this.apiUrl}/${supplier._id}`).subscribe({
          next: () => {
            this.notificationService.success('Éxito', 'Proveedor eliminado correctamente');
            this.loadProviders();
          },
          error: (error) => {
            console.error('Error deleting supplier:', error);
            this.notificationService.error('Error', 'No se pudo eliminar el proveedor');
          }
        });
      }
    });
  }
}
