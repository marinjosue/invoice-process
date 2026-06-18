import { Routes } from '@angular/router';
import { SettlementsPage } from './SettlementsPage';
import { SettlementDetailPage } from './SettlementDetailPage';

export const settlementsRoutes: Routes = [
  {
    path: '',
    component: SettlementsPage
  },
  {
    path: ':id',
    component: SettlementDetailPage
  }
];
