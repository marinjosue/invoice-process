import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/core/services/api.service';

export interface CrudResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  constructor(private apiService: ApiService) {}

  list<T>(endpoint: string, page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<T>> {
    return this.apiService.get<PaginatedResponse<T>>(`${endpoint}?page=${page}&pageSize=${pageSize}`);
  }

  getById<T>(endpoint: string, id: string): Observable<CrudResponse<T>> {
    return this.apiService.get<CrudResponse<T>>(`${endpoint}/${id}`);
  }

  create<T>(endpoint: string, data: any): Observable<CrudResponse<T>> {
    return this.apiService.post<CrudResponse<T>>(endpoint, data);
  }

  update<T>(endpoint: string, id: string, data: any): Observable<CrudResponse<T>> {
    return this.apiService.put<CrudResponse<T>>(`${endpoint}/${id}`, data);
  }

  delete(endpoint: string, id: string): Observable<CrudResponse<any>> {
    return this.apiService.delete<CrudResponse<any>>(`${endpoint}/${id}`);
  }
}
