import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  invoices: {
    total: number;
    pending: number;
    totalAmount: number;
    avgAmount: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
  suppliers: {
    total: number;
  };
  settlements: {
    total: number;
  };
  recentInvoices: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<{ success: boolean; stats: DashboardStats }> {
    return this.http.get<{ success: boolean; stats: DashboardStats }>(`${this.apiUrl}/stats`);
  }
}
