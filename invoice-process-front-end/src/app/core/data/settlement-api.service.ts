import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Settlement, CreateSettlementRequest, UpdateSettlementRequest, FinalizeSettlementResponse } from '../../../types/settlement.types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettlementApiService {
  private endpoint = `${environment.apiUrl}/settlements`;

  constructor(private http: HttpClient) { }

  list(filters?: {
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<{ success: boolean; count: number; settlements: Settlement[] }> {
    let url = this.endpoint;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.http.get<{ success: boolean; count: number; settlements: Settlement[] }>(url);
  }

  getById(id: string): Observable<{ success: boolean; settlement: Settlement }> {
    return this.http.get<{ success: boolean; settlement: Settlement }>(`${this.endpoint}/${id}`);
  }

  create(settlement: CreateSettlementRequest): Observable<{ success: boolean; message: string; settlement: Settlement }> {
    return this.http.post<{ success: boolean; message: string; settlement: Settlement }>(this.endpoint, settlement);
  }

  update(id: string, settlement: UpdateSettlementRequest): Observable<{ success: boolean; message: string; settlement: Settlement }> {
    return this.http.put<{ success: boolean; message: string; settlement: Settlement }>(`${this.endpoint}/${id}`, settlement);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.endpoint}/${id}`);
  }

  addInvoice(id: string, invoiceId: string): Observable<{ success: boolean; message: string; settlement: Settlement }> {
    return this.http.post<{ success: boolean; message: string; settlement: Settlement }>(`${this.endpoint}/${id}/invoices`, { invoiceId });
  }

  removeInvoice(id: string, invoiceId: string): Observable<{ success: boolean; message: string; settlement: Settlement }> {
    return this.http.delete<{ success: boolean; message: string; settlement: Settlement }>(`${this.endpoint}/${id}/invoices/${invoiceId}`);
  }

  getStatistics(): Observable<{ success: boolean; statistics: any }> {
    return this.http.get<{ success: boolean; statistics: any }>(`${this.endpoint}/statistics`);
  }

  finalize(id: string): Observable<FinalizeSettlementResponse> {
    return this.http.post<FinalizeSettlementResponse>(`${this.endpoint}/${id}/finalize`, {});
  }

  generateReport(id: string): Observable<{ success: boolean; message: string; signedUrl: string; gcsPath: string }> {
    return this.http.post<{ success: boolean; message: string; signedUrl: string; gcsPath: string }>(`${this.endpoint}/${id}/report`, {});
  }

  getReport(id: string): Observable<{ success: boolean; signedUrl: string; gcsPath: string }> {
    return this.http.get<{ success: boolean; signedUrl: string; gcsPath: string }>(`${this.endpoint}/${id}/report`);
  }
}
