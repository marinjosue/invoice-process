import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NotificationService } from '@/shared/services/notification.service';
import { GlobalConfirmationService } from '@/shared/services/confirmation.service';
import { CategoryApiService } from '@/core/data/category-api.service';
import { environment } from '../../../environments/environment';
import { ProductFormDialogComponent, ProductFormData, Category } from '@/components/products/product-form-dialog.component';
import { ProductListTableComponent, Product } from '@/components/products/product-list-table.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmDialogModule,
    ProductFormDialogComponent,
    ProductListTableComponent
  ],
  template: `
    <p-confirmDialog />
    
    <app-product-form-dialog
      [(visible)]="showDialog"
      [isEditMode]="isEditMode"
      [isSaving]="isSaving"
      [productData]="currentProductData"
      [categories]="categories()"
      (save)="saveProduct($event)"
      (cancel)="closeDialog()"
    />
    
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Productos</h2>
        <p-button 
          label="Nuevo Producto" 
          icon="pi pi-plus"
          (onClick)="createProduct()" 
        />
      </div>

      <app-product-list-table
        [products]="filteredProducts()"
        [isLoading]="isLoading()"
        [(searchValue)]="searchTerm"
        (searchValueChange)="onSearch()"
        (edit)="editProduct($event)"
        (delete)="deleteProduct($event)"
      />
    </div>
  `
})
export class ProductsPage implements OnInit {
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  searchTerm = '';
  showDialog = false;
  isEditMode = false;
  isSaving = false;
  currentProductId: string | null = null;
  currentProductData: ProductFormData | null = null;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private confirmationService: GlobalConfirmationService,
    private categoryApiService: CategoryApiService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryApiService.list({ isActive: true }).subscribe({
      next: (response) => {
        this.categories.set(response.categories || []);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar las categorías');
      }
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/products`).subscribe({
      next: (response) => {
        const productList = response.products || [];
        this.products.set(productList);
        this.filteredProducts.set(productList);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.notificationService.error('Error', 'No se pudieron cargar los productos');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProducts.set(this.products());
      return;
    }

    const filtered = this.products().filter(product => 
      product.sku?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    );
    this.filteredProducts.set(filtered);
  }

  createProduct(): void {
    this.isEditMode = false;
    this.currentProductId = null;
    this.currentProductData = null;
    this.showDialog = true;
  }

  editProduct(id: string): void {
    this.isEditMode = true;
    this.currentProductId = id;
    
    // Cargar datos del producto
    this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe({
      next: (response) => {
        this.currentProductData = {
          sku: response.product.sku,
          description: response.product.description,
          unit: response.product.unit,
          categoryId: response.product.categoryId,
          estimatedCost: response.product.estimatedCost,
          currentStock: response.product.currentStock,
          minStock: response.product.minStock,
          warehouseLocation: response.product.warehouseLocation,
          isActive: response.product.isActive
        };
        this.showDialog = true;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.notificationService.error('Error', 'No se pudo cargar el producto');
      }
    });
  }

  closeDialog(): void {
    this.showDialog = false;
    this.currentProductData = null;
    this.currentProductId = null;
  }

  saveProduct(formData: ProductFormData): void {
    this.isSaving = true;

    const request$ = this.isEditMode
      ? this.http.put(`${environment.apiUrl}/products/${this.currentProductId}`, formData)
      : this.http.post(`${environment.apiUrl}/products`, formData);

    request$.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Producto actualizado' : 'Producto creado';
        this.notificationService.success('Éxito', message);
        this.closeDialog();
        this.loadProducts();
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving product:', error);
        this.notificationService.error('Error', 'No se pudo guardar el producto');
        this.isSaving = false;
      }
    });
  }

  deleteProduct(id: string): void {
    const product = this.products().find(p => p._id === id);
    const productName = product?.description || product?.sku || 'este producto';

    this.confirmationService.confirmDelete({
      message: `¿Estás seguro de eliminar "${productName}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      onAccept: () => {
        this.http.delete(`${environment.apiUrl}/products/${id}`).subscribe({
          next: () => {
            this.notificationService.success('Éxito', 'Producto eliminado correctamente');
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.notificationService.error('Error', 'No se pudo eliminar el producto');
          }
        });
      }
    });
  }
}
