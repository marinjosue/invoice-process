import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { AuthGuard } from '@/core/guards/auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';

export const appRoutes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('@/pages/auth/auth.routes').then(m => m.authRoutes),
        data: { breadcrumb: 'Authentication' }
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'dashboard',
                loadChildren: () => import('@/pages/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
                data: { breadcrumb: 'Dashboard' }
            },
            {
                path: 'profile',
                loadChildren: () => import('@/pages/profile/profile.routes').then(m => m.profileRoutes),
                data: { breadcrumb: 'Profile' }
            },
            {
                path: 'products',
                loadChildren: () => import('@/pages/products/products.routes').then(m => m.productsRoutes),
                canActivate: [RoleGuard],
                data: { breadcrumb: 'Products', permission: 'products' }
            },
            {
                path: 'providers',
                loadChildren: () => import('@/pages/providers/providers.routes').then(m => m.providersRoutes),
                canActivate: [RoleGuard],
                data: { breadcrumb: 'Providers', permission: 'providers' }
            },
            {
                path: 'invoices',
                loadChildren: () => import('@/pages/invoices/invoices.routes').then(m => m.invoicesRoutes),
                data: { breadcrumb: 'Invoices' }
            },
            {
                path: 'settlements',
                loadChildren: () => import('@/pages/settlements/settlements.routes').then(m => m.settlementsRoutes),
                canActivate: [RoleGuard],
                data: { breadcrumb: 'Settlements', permission: 'settlements' }
            },
            {
                path: 'categories',
                loadChildren: () => import('@/pages/categories/categories.routes').then(m => m.categoriesRoutes),
                canActivate: [RoleGuard],
                data: { breadcrumb: 'Categories', permission: 'categories' }
            },
            {
                path: 'inventory',
                loadChildren: () => import('@/pages/inventory/inventory.routes').then(m => m.inventoryRoutes),
                canActivate: [RoleGuard],
                data: { breadcrumb: 'Inventory', permission: 'inventory' }
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
