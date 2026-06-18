import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService, PaginatedResponse } from '@/shared/services/crud.service';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../../types/product.types';

@Injectable({
  providedIn: 'root'
})
export class ProductApiService {
  private endpoint = '/products';

  constructor(private crudService: CrudService) {}

  list(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Product>> {
    return this.crudService.list<Product>(this.endpoint, page, pageSize);
  }

  getById(id: string): Observable<any> {
    return this.crudService.getById<Product>(this.endpoint, id);
  }

  create(product: CreateProductRequest): Observable<any> {
    return this.crudService.create<Product>(this.endpoint, product);
  }

  update(id: string, product: UpdateProductRequest): Observable<any> {
    return this.crudService.update<Product>(this.endpoint, id, product);
  }

  delete(id: string): Observable<any> {
    return this.crudService.delete(this.endpoint, id);
  }

  getByProvider(providerId: string, page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Product>> {
    return this.crudService.list<Product>(`${this.endpoint}/provider/${providerId}`, page, pageSize);
  }
}
