import { Component, ElementRef, ViewChild, ChangeDetectorRef, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/layout/service/layout.service';
import { AuthService } from '@/core/services/auth.service';
import { AppBreadcrumb } from './app.breadcrumb';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppBreadcrumb, ButtonModule],
    template: `<div class="layout-topbar" [class.scrolled]="isScrolled">
        <div class="topbar-start">
            <button #menubutton type="button" class="topbar-menubutton p-link p-trigger hover:cursor-pointer" (click)="onMenuButtonClick()">
                <i class="pi pi-bars"></i>
            </button>
            <nav app-breadcrumb class="topbar-breadcrumb"></nav>
        </div>

        <div class="topbar-end">
            <ul class="topbar-menu">
                <li class="ml-3">
                    <p-button icon="pi pi-palette" rounded (onClick)="onConfigButtonClick()"></p-button>
                </li>
                <li class="topbar-profile">
                <button
                    type="button"
                    class="p-link hover:cursor-pointer flex items-center"
                    (click)="onProfileButtonClick()"
                >
                    
                    @if (authService.user$ | async; as user) {
                    @if (user.profilePicture) {
                        <img
                        [src]="user.profilePicture"
                        [alt]="user.firstName + ' ' + user.lastName"
                        class="w-8 h-8 rounded-full object-cover"
                        />
                    } @else {
                        <div
                        class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold"
                        aria-label="Perfil"
                        [title]="user.firstName + ' ' + user.lastName"
                        >
                        {{ getInitials(user.firstName, user.lastName) }}
                        </div>
                    }
                    } @else {
                    <img
                        src="/layout/images/avatar.png"
                        alt="Profile"
                        class="w-8 h-8 rounded-full object-cover"
                    />
                    }
                </button>
                </li>

            </ul>
        </div>
    </div>`
})
export class AppTopbar implements OnInit, OnDestroy {
    @ViewChild('menubutton') menuButton!: ElementRef;
    private userSubscription!: Subscription;
    isScrolled = false;

    @HostListener('window:scroll', ['$event'])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 20;
    }

    constructor(
        public layoutService: LayoutService,
        public authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // Suscribirse a cambios del usuario para forzar detección de cambios
        this.userSubscription = this.authService.user$.subscribe(() => {
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy(): void {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    onProfileButtonClick() {
        this.layoutService.showProfileSidebar();
    }

    onConfigButtonClick() {
        this.layoutService.showConfigSidebar();
    }

    getInitials(firstName: string, lastName: string): string {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';
        return `${first}${last}`;
    }
}
