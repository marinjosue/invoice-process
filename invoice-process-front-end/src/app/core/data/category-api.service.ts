import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../types/category.types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryApiService {
  private endpoint = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  list(filters?: {
    isActive?: boolean;
    search?: string;
  }): Observable<{ success: boolean; count: number; categories: Category[] }> {
    let url = this.endpoint;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.search) params.append('search', filters.search);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.http.get<{ success: boolean; count: number; categories: Category[] }>(url);
  }

  getById(id: string): Observable<{ success: boolean; category: Category }> {
    return this.http.get<{ success: boolean; category: Category }>(`${this.endpoint}/${id}`);
  }

  create(category: CreateCategoryRequest): Observable<{ success: boolean; message: string; category: Category }> {
    return this.http.post<{ success: boolean; message: string; category: Category }>(this.endpoint, category);
  }

  update(id: string, category: UpdateCategoryRequest): Observable<{ success: boolean; message: string; category: Category }> {
    return this.http.put<{ success: boolean; message: string; category: Category }>(`${this.endpoint}/${id}`, category);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.endpoint}/${id}`);
  }
}
