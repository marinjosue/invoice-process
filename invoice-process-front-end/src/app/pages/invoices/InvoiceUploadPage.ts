import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InvoiceService } from '@/core/services/InvoiceService';
import { NotificationService } from '@/shared/services/notification.service';

@Component({
  selector: 'app-invoice-upload-page',
  standalone: true,
  imports: [CommonModule, FileUploadModule, ButtonModule, CardModule, ProgressSpinnerModule],
  template: `
    <div class="card">
      <h2 class="text-2xl font-bold mb-4">Subir Factura</h2>
      
      @if (isUploading()) {
        <div class="flex justify-center items-center p-8">
          <p-progressSpinner />
          <p class="ml-4">{{ uploadMessage() }}</p>
        </div>
      } @else if (pdfPreviewUrl()) {
        <!-- Preview del PDF antes de analizar -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- PDF Viewer -->
          <div class="card">
            <h3 class="text-lg font-bold mb-4">Vista Previa del PDF</h3>
            <div class="border border-surface-200 rounded p-2 bg-surface-50">
              <iframe 
                [src]="getSafeUrl(pdfPreviewUrl()!)" 
                width="100%" 
                height="600"
                class="rounded"
                frameborder="0"
              ></iframe>
            </div>
          </div>

          <!-- Acciones -->
          <div class="card">
            <h3 class="text-lg font-bold mb-4">Acciones</h3>
            <p class="mb-4 text-surface-600">
              Archivo: <strong>{{ uploadedFileName() }}</strong>
            </p>
            <p class="mb-6 text-surface-600">
              El PDF se ha cargado correctamente. Puedes analizarlo ahora o guardarlo sin analizar.
            </p>

            <div class="flex flex-col gap-3">
              <p-button 
                label="Analizar" 
                icon="pi pi-sparkles"
                severity="primary"
                (onClick)="analyzeInvoice()"
                styleClass="w-full"
              />
              <p-button 
                label="Cancelar" 
                icon="pi pi-times"
                severity="danger"
                [outlined]="true"
                (onClick)="cancelUpload()"
                styleClass="w-full"
              />
            </div>
          </div>
        </div>
      } @else {
        <!-- Upload Zone -->
        <p-fileUpload
          name="invoice"
          chooseLabel="Seleccionar"
          [customUpload]="true"
          (uploadHandler)="onFileSelect($event)"
          accept="application/pdf"
          [maxFileSize]="10000000"
          [auto]="true"
        >
          <ng-template pTemplate="content">
            <div class="text-center p-8">
              <i class="pi pi-cloud-upload text-6xl text-primary mb-4"></i>
              <p class="text-lg mb-2">Arrastra tu factura PDF aquí</p>
              <p class="text-surface-500">o haz clic para seleccionar</p>
              <p class="text-sm text-surface-400 mt-2">Tamaño máximo: 10MB</p>
            </div>
          </ng-template>
        </p-fileUpload>

        <div class="mt-4">
          <p-button label="Volver" icon="pi pi-arrow-left" [outlined]="true" (onClick)="cancel()" />
        </div>
      }
    </div>
  `
})
export class InvoiceUploadPage {
  isUploading = signal(false);
  uploadMessage = signal('Subiendo archivo...');
  pdfPreviewUrl = signal<string | null>(null);
  uploadedFileName = signal<string>('');
  uploadedFile = signal<File | null>(null);
  uploadedInvoiceId = signal<string | null>(null);

  constructor(
    private invoiceService: InvoiceService,
    private router: Router,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) {}

  onFileSelect(event: any): void {
    const file = event.files[0];
    if (!file) return;

    this.uploadedFile.set(file);
    this.uploadedFileName.set(file.name);

    // Crear URL de preview local
    const fileUrl = URL.createObjectURL(file);
    this.pdfPreviewUrl.set(fileUrl);
  }

  analyzeInvoice(): void {
    const file = this.uploadedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.uploadMessage.set('Subiendo y analizando factura con IA...');

    this.invoiceService.uploadInvoice(file).subscribe({
      next: (response: any) => {
        this.isUploading.set(false);
        this.notificationService.success('Éxito', 'Factura analizada correctamente');
        
        // Ir a validación si hay datos extraídos
        if (response.invoiceId) {
          this.router.navigate(['/invoices/validate', response.invoiceId]);
        } else {
          this.router.navigate(['/invoices/management']);
        }
      },
      error: (error: any) => {
        this.isUploading.set(false);
        this.uploadMessage.set('');
        this.notificationService.error('Error', error?.error?.message || 'No se pudo analizar la factura');
      }
    });
  }


  cancelUpload(): void {
    // Limpiar URL de preview
    const url = this.pdfPreviewUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    
    this.pdfPreviewUrl.set(null);
    this.uploadedFile.set(null);
    this.uploadedFileName.set('');
  }

  cancel(): void {
    this.router.navigate(['/invoices/management']);
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  navigateToUpload(): void {
    this.router.navigate(['/invoices/management']);
  }
}
