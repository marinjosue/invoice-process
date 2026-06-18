import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private messageService: MessageService) {}

  success(summary: string, detail: string = '', life: number = 3000): void {
    this.messageService.add({ severity: 'success', summary, detail, life });
  }

  error(summary: string, detail: string = '', life: number = 3000): void {
    this.messageService.add({ severity: 'error', summary, detail, life });
  }

  warning(summary: string, detail: string = '', life: number = 3000): void {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  info(summary: string, detail: string = '', life: number = 3000): void {
    this.messageService.add({ severity: 'info', summary, detail, life });
  }
}
