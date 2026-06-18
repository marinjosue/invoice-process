import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { NotificationService } from '@/shared/services/notification.service';
import { ProfileService, UserProfile, UpdateProfileRequest } from '@/core/services/profile.service';
import { AuthService } from '@/core/services/auth.service';
import { ProfilePictureComponent } from '@/components/profile/profile-picture.component';
import { ProfileFormComponent, ProfileFormData } from '@/components/profile/profile-form.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ProgressSpinnerModule,
    ProfilePictureComponent,
    ProfileFormComponent
  ],
  template: `
    <div class="grid grid-cols-1 gap-4">
      <h2 class="text-2xl font-bold">Mi Perfil</h2>

      @if (isLoading()) {
        <div class="flex justify-center items-center p-8">
          <p-progressSpinner />
        </div>
      } @else if (userProfile()) {
        <!-- Foto de Perfil -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="px-4 pt-4">
              <h3 class="text-xl font-semibold">Foto de Perfil</h3>
            </div>
          </ng-template>
          <app-profile-picture
            [profilePicture]="userProfile()!.profilePicture || null"
            [userName]="getFullName()"
            [isEditing]="isEditing()"
            (fileSelected)="onProfilePictureSelected($event)"
          />
        </p-card>

        <!-- Organización y Rol -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="px-4 pt-4">
              <h3 class="text-xl font-semibold">Organización</h3>
            </div>
          </ng-template>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-surface-500">Empresa</span>
              <span class="font-medium">{{ getTenantName() }}</span>
            </div>
            @if (getTenantSubdomain()) {
              <div class="flex items-center justify-between">
                <span class="text-surface-500">Subdominio</span>
                <span class="font-medium">{{ getTenantSubdomain() }}</span>
              </div>
            }
            <div class="flex items-center justify-between">
              <span class="text-surface-500">Rol</span>
              <p-tag [value]="getRoleLabel()" [severity]="getRoleSeverity()" />
            </div>
          </div>
        </p-card>

        <!-- Información Personal -->
        <app-profile-form
          [profileData]="profileFormData()"
          [isSaving]="isSaving()"
          [isEditing]="isEditing()"
          [hasPhotoSelected]="hasPhotoSelected()"
          (save)="onSaveProfile($event)"
          (cancel)="onCancelEdit()"
          (edit)="onStartEdit()"
        />
      }
    </div>
  `
})
export class ProfilePage implements OnInit {
  userProfile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  isEditing = signal(false);
  profileFormData = signal<ProfileFormData | null>(null);
  selectedProfilePicture: File | null = null;
  hasPhotoSelected = signal(false);

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.userProfile.set(response.user);
        this.updateProfileFormData();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.notificationService.error('Error', 'No se pudo cargar el perfil');
        this.isLoading.set(false);
      }
    });
  }

  getFullName(): string {
    const profile = this.userProfile();
    if (profile) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return '';
  }

  getTenantName(): string {
    const tenant = this.userProfile()?.tenantId;
    return tenant?.name ?? 'N/A';
  }

  getTenantSubdomain(): string | null {
    const tenant = this.userProfile()?.tenantId;
    return tenant?.subdomain ?? null;
  }

  getRoleLabel(): string {
    const role = this.userProfile()?.role ?? '';
    const labels: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      user: 'Usuario',
      viewer: 'Lector',
    };
    return labels[role] ?? role;
  }

  getRoleSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const role = this.userProfile()?.role ?? '';
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      admin: 'danger',
      manager: 'warn',
      user: 'info',
      viewer: 'secondary',
    };
    return severities[role] ?? 'info';
  }

  getProfileFormData(): ProfileFormData | null {
    const profile = this.userProfile();
    if (!profile) return null;
    
    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone
    };
  }

  updateProfileFormData(): void {
    this.profileFormData.set(this.getProfileFormData());
  }

  onProfilePictureSelected(file: File): void {
    // Solo almacenar el archivo seleccionado, no subir inmediatamente
    this.selectedProfilePicture = file;
    this.hasPhotoSelected.set(true);
  }

  onSaveProfile(data: ProfileFormData): void {
    this.isSaving.set(true);
    
    // Primero subir la foto si hay una seleccionada
    if (this.selectedProfilePicture) {
      this.profileService.uploadProfilePicture(this.selectedProfilePicture).subscribe({
        next: (photoResponse) => {
          // Luego actualizar el perfil con la nueva foto
          this.updateProfileWithData(data, photoResponse.profilePicture);
        },
        error: (error) => {
          console.error('Error uploading picture:', error);
          this.notificationService.error('Error', 'No se pudo subir la foto de perfil');
          this.isSaving.set(false);
        }
      });
    } else {
      // Solo actualizar los datos sin foto
      this.updateProfileWithData(data);
    }
  }

  private updateProfileWithData(data: ProfileFormData, newProfilePicture?: string): void {
    const updateData: UpdateProfileRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone
    };

    this.profileService.updateProfile(updateData).subscribe({
      next: (response) => {
        // Si hay nueva foto, actualizar el objeto del usuario
        const updatedUser = newProfilePicture 
          ? { ...response.user, profilePicture: newProfilePicture }
          : response.user;
        
        this.userProfile.set(updatedUser);
        this.updateProfileFormData();
        
        // Actualizar en AuthService inmediatamente con la nueva foto
        this.authService.updateUserData({
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          ...(newProfilePicture && { profilePicture: newProfilePicture })
        });
        
        // Refrescar datos del usuario desde el backend para asegurar sincronización
        this.authService.refreshUserData().subscribe({
          next: () => {
            console.log('Datos del usuario refrescados correctamente');
          },
          error: (error) => {
            console.warn('Error al refrescar datos del usuario:', error);
          }
        });
        
        this.notificationService.success('Éxito', 'Perfil actualizado correctamente');
        this.selectedProfilePicture = null;
        this.hasPhotoSelected.set(false);
        this.isSaving.set(false);
        this.isEditing.set(false);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.notificationService.error('Error', 'No se pudo actualizar el perfil');
        this.isSaving.set(false);
      }
    });
  }

  onStartEdit(): void {
    this.isEditing.set(true);
  }

  onCancelEdit(): void {
    this.selectedProfilePicture = null;
    this.hasPhotoSelected.set(false);
    this.isEditing.set(false);
  }
}
