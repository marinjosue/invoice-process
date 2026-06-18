import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SearchResult {
  type: 'invoice' | 'product';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const searchTerm = query.trim().toLowerCase();
    
    // Búsqueda en facturas y productos en paralelo
    const invoicesSearch$ = this.searchInvoices(searchTerm);
    const productsSearch$ = this.searchProducts(searchTerm);

    // Combinar resultados
    return new Observable<SearchResult[]>(observer => {
      const results: SearchResult[] = [];
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          observer.next(results);
          observer.complete();
        }
      };

      invoicesSearch$.subscribe({
        next: (invoiceResults) => {
          results.push(...invoiceResults);
          checkComplete();
        },
        error: () => checkComplete()
      });

      productsSearch$.subscribe({
        next: (productResults) => {
          results.push(...productResults);
          checkComplete();
        },
        error: () => checkComplete()
      });
    });
  }

  private searchInvoices(query: string): Observable<SearchResult[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invoices`).pipe(
      map(invoices => {
        return invoices
          .filter(invoice => 
            invoice.numeroFactura?.toLowerCase().includes(query) ||
            invoice.supplier?.name?.toLowerCase().includes(query)
          )
          .slice(0, 5)
          .map(invoice => ({
            type: 'invoice' as const,
            id: invoice._id,
            title: `Factura ${invoice.numeroFactura}`,
            subtitle: `${invoice.supplier?.name || 'Sin proveedor'} - $${invoice.total?.toFixed(2) || '0.00'}`,
            icon: 'pi pi-file-pdf',
            route: `/invoices/${invoice._id}`
          }));
      }),
      catchError(() => of([]))
    );
  }

  private searchProducts(query: string): Observable<SearchResult[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => {
        return products
          .filter(product => 
            product.sku?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.category?.name?.toLowerCase().includes(query)
          )
          .slice(0, 5)
          .map(product => ({
            type: 'product' as const,
            id: product._id,
            title: `${product.sku} - ${product.description}`,
            subtitle: `${product.category?.name || 'Sin categoría'} - Stock: ${product.stock || 0}`,
            icon: 'pi pi-box',
            route: `/products`
          }));
      }),
      catchError(() => of([]))
    );
  }
}
