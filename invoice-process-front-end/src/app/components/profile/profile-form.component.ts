import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule
  ],
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="px-4 pt-4">
          <h3 class="text-xl font-semibold">Información Personal</h3>
        </div>
      </ng-template>
      
      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label htmlFor="firstName" class="font-medium text-sm">Nombre *</label>
            <input 
              pInputText 
              id="firstName" 
              formControlName="firstName" 
              placeholder="Tu nombre"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label htmlFor="lastName" class="font-medium text-sm">Apellido *</label>
            <input 
              pInputText 
              id="lastName" 
              formControlName="lastName" 
              placeholder="Tu apellido"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label htmlFor="email" class="font-medium text-sm">Email</label>
          <input 
            pInputText 
            id="email" 
            type="email" 
            formControlName="email" 
            placeholder="tu@email.com"
          />
          <small class="text-surface-500">El email no se puede cambiar desde aquí</small>
        </div>

        <div class="flex flex-col gap-2">
          <label htmlFor="phone" class="font-medium text-sm">Teléfono</label>
          <input 
            pInputText 
            id="phone" 
            formControlName="phone" 
            placeholder="+57 300 123 4567"
          />
        </div>

        <div class="flex justify-end gap-2 mt-4">
          @if (!isEditing) {
            <p-button 
              label="Editar" 
              icon="pi pi-pencil"
              type="button"
              (onClick)="onEdit()"
            />
          } @else {
            <p-button 
              label="Cancelar" 
              severity="secondary" 
              [outlined]="true"
              type="button"
              (onClick)="onCancel()"
            />
            <p-button 
              label="Guardar Cambios" 
              type="submit"
              [loading]="isSaving"
              [disabled]="(!profileForm.valid || (!profileForm.dirty && !hasPhotoSelected)) || isSaving"
            />
          }
        </div>
      </form>
    </p-card>
  `
})
export class ProfileFormComponent implements OnInit, OnChanges {
  @Input() profileData: ProfileFormData | null = null;
  @Input() isSaving = false;
  @Input() isEditing = false;
  @Input() hasPhotoSelected = false;
  
  @Output() save = new EventEmitter<ProfileFormData>();
  @Output() cancel = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();

  profileForm: FormGroup;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.profileForm = this.fb.group({
      firstName: [{ value: '', disabled: true }, Validators.required],
      lastName: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.updateFormState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profileData'] && this.profileData) {
      this.profileForm.patchValue(this.profileData);
      this.profileForm.markAsPristine();
    }

    if (changes['isEditing']) {
      setTimeout(() => this.updateFormState(), 0);
    }
  }

  private updateFormState(): void {
    const firstNameControl = this.profileForm.get('firstName');
    const lastNameControl = this.profileForm.get('lastName');
    const phoneControl = this.profileForm.get('phone');
    
    if (this.isEditing) {
      firstNameControl?.enable();
      lastNameControl?.enable();
      phoneControl?.enable();
    } else {
      firstNameControl?.disable();
      lastNameControl?.disable();
      phoneControl?.disable();
    }
    
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.profileForm.valid && (this.profileForm.dirty || this.hasPhotoSelected)) {
      const formValue = this.profileForm.getRawValue();
      this.save.emit({
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone
      });
    }
  }

  onCancel(): void {
    this.profileForm.patchValue(this.profileData || {});
    this.profileForm.markAsPristine();
    this.cancel.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }
}
