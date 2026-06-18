import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-delete-button',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  template: `<button 
    pButton 
    pRipple 
    type="button" 
    icon="pi pi-trash" 
    label="Delete" 
    [loading]="isLoading"
    (click)="onDelete.emit()"
    class="p-button-danger">
  </button>`,
})
export class DeleteButtonComponent {
  @Input() isLoading: boolean = false;
  @Output() onDelete = new EventEmitter<void>();
}
