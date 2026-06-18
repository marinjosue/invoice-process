import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-stat-card-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, CardModule],
  template: `
    <p-card styleClass="h-full surface-card shadow-3 border-round-xl">
      <div class="flex flex-column gap-3" style="min-height: 160px;">
        <div class="flex align-items-start justify-content-between gap-2">
          <div class="flex-1" style="overflow: hidden;">
            <p-skeleton width="70%" height="0.875rem" styleClass="mb-3" />
            <p-skeleton width="50%" styleClass="mb-2 skeleton-value" />
            <p-skeleton width="60%" height="0.75rem" />
          </div>
          <p-skeleton shape="circle" styleClass="skeleton-icon" />
        </div>
        <div class="pt-2 border-top-1 surface-border mt-auto">
          <p-skeleton width="100%" height="2.25rem" borderRadius="6px" />
        </div>
      </div>
    </p-card>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    :host ::ng-deep .skeleton-icon {
      width: 3rem;
      height: 3rem;
      min-width: 3rem;
      min-height: 3rem;
    }

    @media (min-width: 576px) {
      :host ::ng-deep .skeleton-icon {
        width: 3.5rem;
        height: 3.5rem;
        min-width: 3.5rem;
        min-height: 3.5rem;
      }
    }

    @media (min-width: 768px) {
      :host ::ng-deep .skeleton-icon {
        width: 4rem;
        height: 4rem;
        min-width: 4rem;
        min-height: 4rem;
      }
    }

    :host ::ng-deep .skeleton-value {
      height: 1.5rem;
    }

    @media (min-width: 576px) {
      :host ::ng-deep .skeleton-value {
        height: 1.75rem;
      }
    }

    @media (min-width: 768px) {
      :host ::ng-deep .skeleton-value {
        height: 2rem;
      }
    }
  `]
})
export class StatCardSkeletonComponent {}
