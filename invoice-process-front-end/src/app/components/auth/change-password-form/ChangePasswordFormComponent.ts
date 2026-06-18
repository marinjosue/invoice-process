import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthValidators, FormUtils } from '../utils';

export interface ChangePasswordFormValue {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule
  ],
  template: `
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
        Cambiar Contraseña
      </div>
      <span class="text-surface-600 dark:text-surface-400 font-medium">
        Actualiza tu contraseña de acceso
      </span>
    </div>

    <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()">
      <div class="mb-4">
        <label for="currentPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Contraseña Actual
        </label>
        <input
          pInputText
          id="currentPassword"
          type="password"
          formControlName="currentPassword"
          placeholder="••••••••"
          class="w-full"
          [class.ng-invalid]="hasError('currentPassword')"
          [class.ng-dirty]="hasError('currentPassword')"
        />
        @if (hasError('currentPassword', 'required')) {
          <small class="text-red-500">La contraseña actual es requerida</small>
        }
      </div>

      <div class="mb-4">
        <label for="newPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Nueva Contraseña
        </label>
        <input
          pInputText
          id="newPassword"
          type="password"
          formControlName="newPassword"
          placeholder="••••••••"
          class="w-full"
          [class.ng-invalid]="hasError('newPassword')"
          [class.ng-dirty]="hasError('newPassword')"
        />
        @if (hasError('newPassword', 'required')) {
          <small class="text-red-500">La nueva contraseña es requerida</small>
        }
        @if (hasError('newPassword', 'minlength')) {
          <small class="text-red-500">Mínimo 6 caracteres</small>
        }
      </div>

      <div class="mb-6">
        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Confirmar Nueva Contraseña
        </label>
        <input
          pInputText
          id="confirmPassword"
          type="password"
          formControlName="confirmPassword"
          placeholder="••••••••"
          class="w-full"
          [class.ng-invalid]="hasError('confirmPassword')"
          [class.ng-dirty]="hasError('confirmPassword')"
        />
        @if (hasError('confirmPassword', 'required')) {
          <small class="text-red-500">Confirma tu nueva contraseña</small>
        }
        @if (changePasswordForm.hasError('passwordMismatch') && changePasswordForm.get('confirmPassword')?.touched) {
          <small class="text-red-500">Las contraseñas no coinciden</small>
        }
      </div>
      
      <div class="mt-2">
        <p-button
          type="submit"
          label="Cambiar contraseña"
          [loading]="isLoading"
          [disabled]="isLoading"
          styleClass="w-full p-button-rounded"
        ></p-button>

        <div class="flex justify-center mt-2">
          <p-button
            label="Cancelar"
            [link]="true"
            (click)="onCancel($event)"
            [disabled]="isLoading"
          ></p-button>
        </div>
      </div>

    </form>
  `
})
export class ChangePasswordFormComponent {
  @Input() isLoading: boolean = false;
  @Output() submitForm = new EventEmitter<ChangePasswordFormValue>();

  changePasswordForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: AuthValidators.passwordMatch('newPassword', 'confirmPassword')
    });
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      FormUtils.markFormGroupTouched(this.changePasswordForm);
      return;
    }

    this.submitForm.emit(this.changePasswordForm.value);
  }

  hasError(field: string, errorType?: string): boolean {
    const control = this.changePasswordForm.get(field);
    if (!control || !control.touched) return false;
    
    if (errorType) {
      return control.hasError(errorType);
    }
    return control.invalid;
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/']);
  }
}
