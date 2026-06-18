import { Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class GlobalConfirmationService {
  constructor(private confirmationService: ConfirmationService) {}

  /**
   * Muestra un diálogo de confirmación para eliminar
   */
  confirmDelete(options: {
    header?: string;
    message: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    onAccept: () => void;
    onReject?: () => void;
  }): void {
    this.confirmationService.confirm({
      header: options.header || '¿Confirmar eliminación?',
      message: options.message,
      icon: options.icon || 'pi pi-exclamation-triangle',
      acceptLabel: options.acceptLabel || 'Eliminar',
      rejectLabel: options.rejectLabel || 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: options.onAccept,
      reject: options.onReject
    });
  }

  /**
   * Muestra un diálogo de confirmación genérico
   */
  confirm(options: {
    header?: string;
    message: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    acceptButtonClass?: string;
    onAccept: () => void;
    onReject?: () => void;
  }): void {
    this.confirmationService.confirm({
      header: options.header || '¿Confirmar acción?',
      message: options.message,
      icon: options.icon || 'pi pi-question-circle',
      acceptLabel: options.acceptLabel || 'Aceptar',
      rejectLabel: options.rejectLabel || 'Cancelar',
      acceptButtonStyleClass: options.acceptButtonClass || 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: options.onAccept,
      reject: options.onReject
    });
  }
}
