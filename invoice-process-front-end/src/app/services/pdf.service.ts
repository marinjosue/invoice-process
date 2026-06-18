import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PdfUploadResponse {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    publicUrl: string;
    gcsPath: string;
  };
}

export interface PdfFile {
  name: string;
  size: number;
  updated: Date;
  gcsPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private apiUrl = `${environment.apiUrl}/api/pdfs`;

  constructor(private http: HttpClient) {}

  uploadPdf(file: File, folder?: string): Observable<PdfUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = folder ? `${this.apiUrl}/upload?folder=${folder}` : `${this.apiUrl}/upload`;
    
    return this.http.post<PdfUploadResponse>(url, formData);
  }

  uploadPdfWithProgress(file: File, folder?: string): Observable<number | PdfUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = folder ? `${this.apiUrl}/upload?folder=${folder}` : `${this.apiUrl}/upload`;
    
    return this.http.post<PdfUploadResponse>(url, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          return Math.round(100 * event.loaded / (event.total || event.loaded));
        } else if (event.type === HttpEventType.Response) {
          return event.body;
        }
        return 0;
      })
    );
  }

  getViewUrl(gcsPath: string): Observable<{ success: boolean; url: string }> {
    return this.http.get<{ success: boolean; url: string }>(`${this.apiUrl}/view/${gcsPath}`);
  }

  downloadPdf(gcsPath: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${gcsPath}`, {
      responseType: 'blob'
    });
  }

  listPdfs(folder?: string): Observable<{ success: boolean; count: number; data: PdfFile[] }> {
    const url = folder ? `${this.apiUrl}/list?folder=${folder}` : `${this.apiUrl}/list`;
    return this.http.get<{ success: boolean; count: number; data: PdfFile[] }>(url);
  }

  deletePdf(gcsPath: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${gcsPath}`);
  }
}
