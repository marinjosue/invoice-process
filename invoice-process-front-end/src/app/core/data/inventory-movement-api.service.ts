import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryMovement, CreateInventoryMovementRequest, UpdateInventoryMovementRequest, MovementType } from '../../../types/inventory.types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementApiService {
  private endpoint = `${environment.apiUrl}/inventory-movements`;

  constructor(private http: HttpClient) {}

  list(filters?: {
    productId?: string;
    type?: MovementType;
    startDate?: string;
    endDate?: string;
  }): Observable<{ success: boolean; count: number; movements: InventoryMovement[] }> {
    let url = this.endpoint;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.productId) params.append('productId', filters.productId);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.http.get<{ success: boolean; count: number; movements: InventoryMovement[] }>(url);
  }

  getById(id: string): Observable<{ success: boolean; movement: InventoryMovement }> {
    return this.http.get<{ success: boolean; movement: InventoryMovement }>(`${this.endpoint}/${id}`);
  }

  create(movement: CreateInventoryMovementRequest): Observable<{ success: boolean; message: string; movement: InventoryMovement }> {
    return this.http.post<{ success: boolean; message: string; movement: InventoryMovement }>(this.endpoint, movement);
  }

  update(id: string, movement: UpdateInventoryMovementRequest): Observable<{ success: boolean; message: string; movement: InventoryMovement }> {
    return this.http.put<{ success: boolean; message: string; movement: InventoryMovement }>(`${this.endpoint}/${id}`, movement);
  }

  getProductHistory(productId: string): Observable<{ success: boolean; count: number; movements: InventoryMovement[] }> {
    return this.http.get<{ success: boolean; count: number; movements: InventoryMovement[] }>(`${this.endpoint}/product/${productId}`);
  }

  getStatistics(): Observable<{ success: boolean; statistics: any }> {
    return this.http.get<{ success: boolean; statistics: any }>(`${this.endpoint}/statistics`);
  }
}
