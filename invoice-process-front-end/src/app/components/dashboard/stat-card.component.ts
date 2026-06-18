import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  template: `
    <p-card styleClass="h-full surface-card shadow-3 border-round-xl hover:shadow-4 transition-all transition-duration-300">
      <div class="flex flex-column gap-3" style="min-height: 160px;">
        <div class="flex justify-content-between align-items-start gap-2">
          <div class="flex-1 min-w-0" style="overflow: hidden;">
            <span class="block text-600 font-semibold mb-2 text-xs uppercase tracking-wider" style="letter-spacing: 0.5px;">
              {{ title }}
            </span>
            <div class="text-900 font-bold mb-2 transition-all transition-duration-300" style="font-size: clamp(1.5rem, 3vw, 2rem); line-height: 1.2;">
              {{ value }}
            </div>
            @if (subtitle) {
              <div class="text-600 flex align-items-start gap-1" style="font-size: clamp(0.7rem, 1.5vw, 0.875rem); line-height: 1.4;">
                <i class="pi pi-info-circle text-500 flex-shrink-0" style="font-size: 0.65rem; margin-top: 0.2rem;"></i>
                <span class="line-height-3" style="word-break: break-word;">{{ subtitle }}</span>
              </div>
            }
          </div>
          <div class="icon-box flex align-items-center justify-content-center flex-shrink-0">
            <i [class]="'pi pi-' + icon + ' icon-size'"></i>
          </div>
        </div>
        @if (actionLabel && actionRoute) {
          <div class="pt-2 border-top-1 surface-border mt-auto">
            <p-button 
              [label]="actionLabel" 
              [routerLink]="actionRoute" 
              styleClass="w-full p-button-outlined p-button-sm"
              size="small"
              icon="pi pi-arrow-right"
              iconPos="right"
            />
          </div>
        }
      </div>
    </p-card>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    .icon-box {
      width: 3.5rem;
      height: 3.5rem;
      min-width: 3.5rem;
      min-height: 3.5rem;
      background: linear-gradient(135deg, var(--primary-100), var(--primary-50));
      border: 2px solid var(--primary-200);
      border-radius: 1rem;
      transition: all 0.3s ease;
    }

    .icon-box:hover {
      border-color: var(--primary-300);
      background: linear-gradient(135deg, var(--primary-200), var(--primary-100));
      transform: scale(1.05);
    }

    @media (min-width: 576px) {
      .icon-box {
        width: 4rem;
        height: 4rem;
        min-width: 4rem;
        min-height: 4rem;
      }
    }

    @media (min-width: 768px) {
      .icon-box {
        width: 4.5rem;
        height: 4.5rem;
        min-width: 4.5rem;
        min-height: 4.5rem;
      }
    }

    .icon-size {
      font-size: 1.75rem;
      color: var(--primary-600);
      transition: all 0.3s ease;
    }

    @media (min-width: 576px) {
      .icon-size {
        font-size: 2rem;
      }
    }

    @media (min-width: 768px) {
      .icon-size {
        font-size: 2.25rem;
      }
    }

    .icon-box:hover .icon-size {
      color: var(--primary-700);
    }
  `]
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '0';
  @Input() subtitle?: string;
  @Input() icon: string = 'chart-line';
  @Input() actionLabel?: string;
  @Input() actionRoute?: string;
}
