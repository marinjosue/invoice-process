import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MessageService, useValue: messageService },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  it('success usa severity "success" con valores por defecto', () => {
    service.success('Guardado');
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Guardado',
      detail: '',
      life: 3000,
    });
  });

  it('error usa severity "error" y respeta detail/life', () => {
    service.error('Ups', 'Algo falló', 5000);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Ups',
      detail: 'Algo falló',
      life: 5000,
    });
  });

  it('warning mapea a severity "warn"', () => {
    service.warning('Cuidado');
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'warn', summary: 'Cuidado' }),
    );
  });

  it('info usa severity "info"', () => {
    service.info('FYI');
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'info', summary: 'FYI' }),
    );
  });
});
