import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu', 
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li
                app-menuitem
                *ngIf="!item.separator"
                [item]="item"
                [index]="i"
                [root]="true"
            ></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `,
})
export class AppMenu {
    model: any[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Inicio',
                icon: 'pi pi-home',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-fw pi-chart-line',
                        routerLink: ['/dashboard'],
                    },
                ],
            },
            {
                label: 'Gestión',
                icon: 'pi pi-th-large',
                items: [
                    {
                        label: 'Proveedores',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/providers'],
                    },
                    {
                        label: 'Productos',
                        icon: 'pi pi-fw pi-box',
                        routerLink: ['/products'],
                    },
                    {
                        label: 'Categorías',
                        icon: 'pi pi-fw pi-tags',
                        routerLink: ['/categories'],
                    },
                    {
                        label: 'Inventario',
                        icon: 'pi pi-fw pi-warehouse',
                        routerLink: ['/inventory'],
                    },
                ],
            },
            {
                label: 'Operaciones',
                icon: 'pi pi-file',
                items: [
                    {
                        label: 'Cargar Facturas',
                        icon: 'pi pi-fw pi-upload',
                        routerLink: ['/invoices/upload'],
                    },
                    {
                        label: 'Gestión de Facturas',
                        icon: 'pi pi-fw pi-file-edit',
                        routerLink: ['/invoices/management'],
                    },
                    {
                        label: 'Liquidaciones',
                        icon: 'pi pi-fw pi-dollar',
                        routerLink: ['/settlements'],
                    },
                ],
            },
            // {
            //     label: 'Administración',
            //     icon: 'pi pi-cog',
            //     items: [
            //         {
            //             label: 'Usuarios',
            //             icon: 'pi pi-fw pi-user',
            //             routerLink: ['/users'],
            //         },
            //         {
            //             label: 'Tenant',
            //             icon: 'pi pi-fw pi-building',
            //             routerLink: ['/tenants'],
            //         },
            //     ],
            // },
        ];
    }
}
