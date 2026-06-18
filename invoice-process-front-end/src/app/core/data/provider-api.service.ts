import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService, PaginatedResponse } from '@/shared/services/crud.service';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '../../../types/provider.types';

@Injectable({
  providedIn: 'root'
})
export class ProviderApiService {
  private endpoint = '/providers';

  constructor(private crudService: CrudService) {}

  list(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Provider>> {
    return this.crudService.list<Provider>(this.endpoint, page, pageSize);
  }

  getById(id: string): Observable<any> {
    return this.crudService.getById<Provider>(this.endpoint, id);
  }

  create(provider: CreateProviderRequest): Observable<any> {
    return this.crudService.create<Provider>(this.endpoint, provider);
  }

  update(id: string, provider: UpdateProviderRequest): Observable<any> {
    return this.crudService.update<Provider>(this.endpoint, id, provider);
  }

  delete(id: string): Observable<any> {
    return this.crudService.delete(this.endpoint, id);
  }
}
