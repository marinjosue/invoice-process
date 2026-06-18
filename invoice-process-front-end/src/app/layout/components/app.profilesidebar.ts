import { Component, computed, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { LayoutService } from '@/layout/service/layout.service';
import { AuthService } from '@/core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: '[app-profilesidebar]',
    imports: [
        CommonModule,
        ButtonModule,
        DrawerModule,
        RouterModule,
    ],
    template: `
        <p-drawer
            [visible]="visible()"
            (onHide)="onDrawerHide()"
            position="right"
            [transitionOptions]="'.3s cubic-bezier(0, 0, 0.2, 1)'"
            styleClass="layout-profile-sidebar w-full sm:w-25rem"
        >
            <div class="flex flex-col mx-auto md:mx-0">
                <div class="flex items-center mb-6">
                    @if (authService.user$ | async; as user) {
                        @if (user.profilePicture) {
                            <img [src]="user.profilePicture" [alt]="user.firstName + ' ' + user.lastName" 
                                 class="w-16 h-16 rounded-full object-cover mr-4" />
                        } @else {
                            <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold mr-4">
                                {{ getInitials(user.firstName, user.lastName) }}
                            </div>
                        }
                    }
                    <div>
                        <span class="mb-1 font-semibold block">{{ userName }}</span>
                        <span class="text-surface-500 dark:text-surface-400 font-medium">{{ userEmail }}</span>
                    </div>
                </div>

                <ul class="list-none m-0 p-0">
                    <li>
                        <a
                            routerLink="/profile"
                            class="cursor-pointer flex mb-4 p-4 items-center border border-surface-200 dark:border-surface-700 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
                        >
                            <span>
                                <i class="pi pi-user text-xl text-primary"></i>
                            </span>
                            <div class="ml-4">
                                <span class="mb-2 font-semibold">Mi Perfil</span>
                                <p
                                    class="text-surface-500 dark:text-surface-400 m-0"
                                >
                                    Ver y editar información personal
                                </p>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a
                            routerLink="/auth/change-password"
                            class="cursor-pointer flex mb-4 p-4 items-center border border-surface-200 dark:border-surface-700 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
                        >
                            <span>
                                <i class="pi pi-lock text-xl text-primary"></i>
                            </span>
                            <div class="ml-4">
                                <span class="mb-2 font-semibold">Cambiar Contraseña</span>
                                <p
                                    class="text-surface-500 dark:text-surface-400 m-0"
                                >
                                    Actualizar credenciales de acceso
                                </p>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a
                            (click)="logout()"
                            class="cursor-pointer flex mb-4 p-4 items-center border border-surface-200 dark:border-surface-700 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
                        >
                            <span>
                                <i
                                    class="pi pi-power-off text-xl text-primary"
                                ></i>
                            </span>
                            <div class="ml-4">
                                <span class="mb-2 font-semibold">Cerrar Sesión</span>
                                <p
                                    class="text-surface-500 dark:text-surface-400 m-0"
                                >
                                    Salir del sistema
                                </p>
                            </div>
                        </a>
                    </li>
                </ul>
            </div>
        </p-drawer>
    `,
})
export class AppProfileSidebar implements OnInit, OnDestroy {
    public authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private userSubscription!: Subscription;
    
    constructor(public layoutService: LayoutService) {}

    ngOnInit(): void {
        this.userSubscription = this.authService.user$.subscribe(() => {
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy(): void {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    visible = computed(
        () => this.layoutService.layoutState().profileSidebarVisible,
    );

    currentUser = computed(() => {
        const user = this.authService.user$;
        return user;
    });

    get userName(): string {
        const user = this.authService.getCurrentUser();
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user?.email || 'Usuario del Sistema';
    }

    get userEmail(): string {
        return this.authService.getCurrentUser()?.email || '';
    }

    onDrawerHide() {
        this.layoutService.layoutState.update((state) => ({
            ...state,
            profileSidebarVisible: false,
        }));
    }

    logout(): void {
        this.authService.logout();
        this.onDrawerHide();
        this.router.navigate(['/auth/login']);
    }

    getInitials(firstName: string, lastName: string): string {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';
        return `${first}${last}`;
    }
}
