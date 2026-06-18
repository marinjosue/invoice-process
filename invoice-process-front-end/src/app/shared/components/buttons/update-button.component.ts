import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-update-button',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  template: `<button 
    pButton 
    pRipple 
    type="button" 
    icon="pi pi-pencil" 
    label="Update" 
    [loading]="isLoading"
    (click)="onUpdate.emit()"
    class="p-button-success">
  </button>`,
})
export class UpdateButtonComponent {
  @Input() isLoading: boolean = false;
  @Output() onUpdate = new EventEmitter<void>();
}
