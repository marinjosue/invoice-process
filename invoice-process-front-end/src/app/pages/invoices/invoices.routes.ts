import { Routes } from '@angular/router';
import { InvoiceUploadPage } from './InvoiceUploadPage';
import { InvoiceValidateDetailPage } from './InvoiceValidateDetailPage';
import { InvoicesManagementPage } from './InvoicesManagementPage';
import { RoleGuard } from '@/core/guards/role.guard';

export const invoicesRoutes: Routes = [
  {
    path: 'management',
    component: InvoicesManagementPage,
    canActivate: [RoleGuard],
    data: { permission: 'invoices.manage' }
  },
  {
    path: 'upload',
    component: InvoiceUploadPage,
    canActivate: [RoleGuard],
    data: { permission: 'invoices.upload' }
  },
  {
    path: 'validate/:id',
    component: InvoiceValidateDetailPage,
    canActivate: [RoleGuard],
    data: { permission: 'invoices.manage' }
  }
];
