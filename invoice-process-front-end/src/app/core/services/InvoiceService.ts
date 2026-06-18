import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  supplierId: string;
  date: Date | string;
  status: 'DRAFT' | 'PROCESSING' | 'EXTRACTED' | 'VALIDATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FINALIZED';
  subtotal: number;
  tax: number;
  total: number;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  _id?: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface UploadInvoiceResponse {
  success: boolean;
  extractedData: ExtractedInvoiceData;
  fileUrl: string;
}

export interface ExtractedInvoiceData {
  invoiceNumber: string;
  supplierName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  uploadInvoice(file: File): Observable<UploadInvoiceResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadInvoiceResponse>(`${this.apiUrl}/upload`, formData);
  }

  getAllInvoices(status?: string): Observable<{ success: boolean; invoices: Invoice[] }> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http.get<{ success: boolean; invoices: Invoice[] }>(this.apiUrl, { params });
  }

  getInvoiceById(id: string): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.get<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/${id}`);
  }

  validateAndSaveInvoice(invoiceData: Partial<Invoice>): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.post<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/validate-and-save`, invoiceData);
  }

  updateInvoice(id: string, invoiceData: Partial<Invoice>): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.put<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/${id}`, invoiceData);
  }

  deleteInvoice(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }

  finalizeInvoice(id: string): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.post<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/${id}/finalize`, {});
  }

  getFileUrl(id: string, mode: 'view' | 'download' = 'view'): Observable<{ url: string }> {
    const params: Record<string, string> = {};
    if (mode !== 'view') {
      params['mode'] = mode;
    }
    return this.http.get<{ url: string }>(`${this.apiUrl}/${id}/file-url`, { params });
  }

  getFileBlob(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/download`, { responseType: 'blob' });
  }

  checkDuplicates(invoiceId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${invoiceId}/check-duplicates`);
  }

  finalizeValidation(invoiceId: string, validationData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${invoiceId}/validate`, validationData);
  }

  downloadPdf(id: string, fileName?: string): void {
    this.getFileUrl(id, 'download').subscribe({
      next: (response) => {
        const link = document.createElement('a');
        link.href = response.url;
        link.download = fileName || `factura-${id}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (error) => {
        console.error('Error descargando PDF:', error);
      }
    });
  }

  updateStatus(id: string, status: Invoice['status']): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.put<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/${id}`, { status });
  }
}
