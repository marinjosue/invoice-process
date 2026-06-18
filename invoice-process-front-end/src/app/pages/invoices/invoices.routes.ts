import { Routes } from '@angular/router';
import { InvoiceUploadPage } from './InvoiceUploadPage';
import { InvoiceValidateDetailPage } from './InvoiceValidateDetailPage';
import { InvoicesManagementPage } from './InvoicesManagementPage';

export const invoicesRoutes: Routes = [
  {
    path: 'management',
    component: InvoicesManagementPage
  },
  {
    path: 'upload',
    component: InvoiceUploadPage
  },
  {
    path: 'validate/:id',
    component: InvoiceValidateDetailPage
  }
];
