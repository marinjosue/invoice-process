import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { GlobalSearchService, SearchResult } from '@/services/global-search.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ProgressSpinnerModule
  ],
  template: `
    <div class="relative">
      <p-iconfield>
        <p-inputicon class="pi pi-search" />
        <input 
          type="text" 
          pInputText 
          placeholder="Buscar facturas o productos..."
          class="w-75 sm:w-full"
          [(ngModel)]="searchQuery"
          (input)="onSearchInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />
      </p-iconfield>

      @if (showResults()) {
        <div class="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-surface-800 shadow-lg rounded-lg border border-surface-200 dark:border-surface-700 z-50 max-h-96 overflow-auto">
          @if (isLoading()) {
            <div class="flex items-center justify-center p-6">
              <p-progressSpinner 
                styleClass="w-8 h-8" 
                strokeWidth="4"
                animationDuration="1s"
              />
            </div>
          } @else if (results().length > 0) {
            <div class="p-2">
              <!-- Facturas -->
              @if (invoiceResults().length > 0) {
                <div class="mb-2">
                  <div class="px-3 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase">
                    Facturas
                  </div>
                  @for (result of invoiceResults(); track result.id) {
                    <a
                      (click)="navigateTo(result.route)"
                      class="flex items-center px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded cursor-pointer transition-colors"
                    >
                      <i [class]="result.icon + ' text-primary mr-3'"></i>
                      <div class="flex-1">
                        <div class="font-medium text-sm">{{ result.title }}</div>
                        <div class="text-xs text-surface-500 dark:text-surface-400">{{ result.subtitle }}</div>
                      </div>
                    </a>
                  }
                </div>
              }

              <!-- Productos -->
              @if (productResults().length > 0) {
                <div>
                  <div class="px-3 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase">
                    Productos
                  </div>
                  @for (result of productResults(); track result.id) {
                    <a
                      (click)="navigateTo(result.route)"
                      class="flex items-center px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded cursor-pointer transition-colors"
                    >
                      <i [class]="result.icon + ' text-primary mr-3'"></i>
                      <div class="flex-1">
                        <div class="font-medium text-sm">{{ result.title }}</div>
                        <div class="text-xs text-surface-500 dark:text-surface-400">{{ result.subtitle }}</div>
                      </div>
                    </a>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="px-4 py-6 text-center text-surface-500 dark:text-surface-400">
              <i class="pi pi-search text-3xl mb-2"></i>
              <p class="text-sm">No se encontraron resultados</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class GlobalSearchComponent {
  searchQuery = '';
  results = signal<SearchResult[]>([]);
  isLoading = signal(false);
  showResults = signal(false);
  private searchSubject = new Subject<string>();
  private isFocused = false;

  constructor(
    private searchService: GlobalSearchService,
    private router: Router
  ) {
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.isLoading.set(false);
          this.results.set([]);
          return [];
        }
        this.isLoading.set(true);
        return this.searchService.search(query);
      })
    ).subscribe({
      next: (results) => {
        this.results.set(results);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.results.set([]);
      }
    });
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
    this.showResults.set(query.trim().length >= 2);
  }

  onFocus(): void {
    this.isFocused = true;
    if (this.searchQuery.trim().length >= 2) {
      this.showResults.set(true);
    }
  }

  onBlur(): void {
    // Pequeño delay para permitir clicks en los resultados
    setTimeout(() => {
      this.isFocused = false;
      if (!this.isFocused) {
        this.showResults.set(false);
      }
    }, 200);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.showResults.set(false);
    this.searchQuery = '';
    this.results.set([]);
  }

  get invoiceResults(): () => SearchResult[] {
    return () => this.results().filter(r => r.type === 'invoice');
  }

  get productResults(): () => SearchResult[] {
    return () => this.results().filter(r => r.type === 'product');
  }
}
