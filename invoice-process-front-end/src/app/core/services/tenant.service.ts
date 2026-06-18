import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tenant } from '../models/tenant.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private tenantSubject = new BehaviorSubject<Tenant | null>(null);
  public tenant$: Observable<Tenant | null> = this.tenantSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.loadTenant();
  }

  setTenant(tenant: Tenant): void {
    this.storageService.setTenant(tenant);
    this.tenantSubject.next(tenant);
  }

  getTenant(): Tenant | null {
    return this.tenantSubject.value;
  }

  getTenantId(): string | null {
    return this.getTenant()?.id ?? null;
  }

  private loadTenant(): void {
    const tenant = this.storageService.getTenant();
    if (tenant) {
      this.tenantSubject.next(tenant);
    }
  }
}
