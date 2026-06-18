import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    FileUploadModule,
    AvatarModule
  ],
  template: `
    <div class="flex flex-col items-center gap-4">
      <div class="relative">
        @if (previewUrl || profilePicture) {
          <img 
            [src]="previewUrl || profilePicture" 
            alt="Foto de perfil" 
            class="w-32 h-32 rounded-full object-cover border-4 border-surface-200 dark:border-surface-700"
          />
        } @else {
          <p-avatar 
            [label]="getInitials()" 
            size="xlarge" 
            [style]="{'width': '8rem', 'height': '8rem', 'font-size': '2.5rem'}"
            shape="circle"
          />
        }
        @if (isEditing) {
          <div class="absolute bottom-0 right-0">
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*" 
              (change)="onFileSelect($event)" 
              class="hidden"
            />
            <label for="file-upload" class="cursor-pointer">
              <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors">
                <i class="pi pi-camera"></i>
              </div>
            </label>
          </div>
        }
      </div>
      @if (isEditing) {
        <div class="text-center">
          @if (selectedFile) {
            <p class="text-green-600 dark:text-green-400 text-sm mb-1">
              ✓ Nueva foto seleccionada: {{ selectedFile.name }}
            </p>
            <p class="text-surface-500 text-xs">
              Haz clic en "Guardar Cambios" para aplicar
            </p>
          } @else {
            <p class="text-surface-600 dark:text-surface-400 text-sm">
              Haz clic en el ícono de cámara para cambiar tu foto
            </p>
            <p class="text-surface-500 dark:text-surface-500 text-xs mt-1">
              Formatos: JPG, PNG, GIF (máx. 5MB)
            </p>
          }
        </div>
      }
    </div>
  `
})
export class ProfilePictureComponent implements OnChanges {
  @Input() profilePicture: string | null = null;
  @Input() userName: string = '';
  @Input() isEditing = false;
  @Output() fileSelected = new EventEmitter<File>();
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Limpiar preview si se cancela la edición
    if (changes['isEditing'] && !changes['isEditing'].currentValue) {
      this.selectedFile = null;
      this.previewUrl = null;
    }
  }

  getInitials(): string {
    if (!this.userName) return 'U';
    const parts = this.userName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return this.userName.substring(0, 2).toUpperCase();
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes');
        return;
      }
      
      // Almacenar archivo seleccionado
      this.selectedFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      
      // Emitir archivo para el componente padre
      this.fileSelected.emit(file);
      
      // Limpiar input
      event.target.value = '';
    }
  }


}
