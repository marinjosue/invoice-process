import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormUtils } from '../utils';

export interface ForgotPasswordFormValue {
  email: string;
}

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    RouterModule
  ],
  template: `
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
        Recuperar Contraseña
      </div>
      <span class="text-surface-600 dark:text-surface-400 font-medium">
        Ingresa tu email para recibir instrucciones
      </span>
    </div>

    <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
      <div class="mb-6">
        <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Email
        </label>
        <input
          pInputText
          id="email"
          type="email"
          formControlName="email"
          placeholder="correo@ejemplo.com"
          class="w-full"
          [class.ng-invalid]="hasError('email')"
          [class.ng-dirty]="hasError('email')"
        />
        @if (hasError('email', 'required')) {
          <small class="text-red-500">El email es requerido</small>
        }
        @if (hasError('email', 'email')) {
          <small class="text-red-500">Email inválido</small>
        }
      </div>

      <p-button
        type="submit"
        label="Enviar Instrucciones"
        [loading]="isLoading"
        [disabled]="isLoading"
        styleClass="w-full"
      />

      <div class="text-center mt-6">
        <span class="text-surface-600 dark:text-surface-400">
          ¿Recordaste tu contraseña?
          <a routerLink="/auth/login" class="font-medium text-primary hover:underline">
            Volver al Login
          </a>
        </span>
      </div>
    </form>
  `
})
export class ForgotPasswordFormComponent {
  @Input() isLoading: boolean = false;
  @Output() submitForm = new EventEmitter<ForgotPasswordFormValue>();

  forgotPasswordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      FormUtils.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.submitForm.emit(this.forgotPasswordForm.value);
  }

  hasError(field: string, errorType?: string): boolean {
    const control = this.forgotPasswordForm.get(field);
    if (!control || !control.touched) return false;
    
    if (errorType) {
      return control.hasError(errorType);
    }
    return control.invalid;
  }
}
