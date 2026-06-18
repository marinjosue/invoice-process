import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Invoice {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  supplierId: string;
  date: Date | string;
  dueDate?: Date | string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'DRAFT' | 'PROCESSING' | 'EXTRACTED' | 'VALIDATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FINALIZED';
  items?: InvoiceItem[];
  fileUrl?: string;
  extractedData?: any;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceItem {
  _id?: string;
  id?: string;
  invoiceId: string;
  productId?: string;
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
  invoice: Invoice;
  extractedData?: any;
  message?: string;
}

export interface ExtractedInvoiceData {
  invoiceNumber?: string;
  supplierName?: string;
  date?: string;
  total?: number;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceApiService {
  private apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  /**
   * Upload PDF invoice and extract data with Gemini
   */
  uploadInvoice(file: File): Observable<UploadInvoiceResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<UploadInvoiceResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Get all invoices
   */
  getAllInvoices(status?: string): Observable<{ success: boolean; invoices: Invoice[] }> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http.get<{ success: boolean; invoices: Invoice[] }>(this.apiUrl, { params });
  }

  /**
   * Get invoice by ID
   */
  getInvoiceById(id: string): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.get<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get signed URL for invoice file (view or download)
   */
  getInvoiceFileUrl(id: string, mode: 'view' | 'download' = 'view'): Observable<{ url: string }> {
    const params: Record<string, string> = {};
    if (mode !== 'view') {
      params['mode'] = mode;
    }
    return this.http.get<{ url: string }>(`${this.apiUrl}/${id}/file-url`, { params });
  }

  /**
   * Validate and save invoice with items
   * Checks if products exist by SKU, creates new ones if needed
   */
  validateAndSaveInvoice(invoiceData: Partial<Invoice>): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.post<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/validate-and-save`, invoiceData);
  }

  /**
   * Update invoice
   */
  updateInvoice(id: string, invoiceData: Partial<Invoice>): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.put<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/${id}`, invoiceData);
  }

  /**
   * Delete invoice
   */
  deleteInvoice(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Finalize invoice (change status to FINALIZED)
   */
  finalizeInvoice(id: string): Observable<{ success: boolean; invoice: Invoice }> {
    return this.http.post<{ success: boolean; invoice: Invoice }>(`${this.apiUrl}/${id}/finalize`, {});
  }

  /**
   * Get file URL for invoice with authentication token
   */
  getFileUrl(id: string): string {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      return `${this.apiUrl}/${id}/file?token=${encodeURIComponent(token)}`;
    }
    return `${this.apiUrl}/${id}/file`;
  }

  /**
   * Get public file URL for invoice (no auth required)
   */
  getPublicFileUrl(id: string): string {
    return `${this.apiUrl}/public/${id}/file`;
  }

  /**
   * Get file as blob with proper authentication headers
   */
  getFileBlob(id: string): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.get(`${this.apiUrl}/${id}/file`, {
      headers,
      responseType: 'blob'
    });
  }
}
