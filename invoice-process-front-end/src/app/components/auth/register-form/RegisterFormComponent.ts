import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthValidators, FormUtils } from '../utils';

export interface RegisterFormValue {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register-form',
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
        Crear Cuenta
      </div>
      <span class="text-surface-600 dark:text-surface-400 font-medium">
        Regístrate para comenzar
      </span>
    </div>

    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="flex-1">
          <label for="firstName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
            Nombre
          </label>
          <input
            pInputText
            id="firstName"
            type="text"
            formControlName="firstName"
            placeholder="Nombre"
            class="w-full"
            [class.ng-invalid]="hasError('firstName')"
            [class.ng-dirty]="hasError('firstName')"
          />
          @if (hasError('firstName', 'required')) {
            <small class="text-red-500">El nombre es requerido</small>
          }
        </div>

        <div class="flex-1">
          <label for="lastName" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
            Apellido
          </label>
          <input
            pInputText
            id="lastName"
            type="text"
            formControlName="lastName"
            placeholder="Apellido"
            class="w-full"
            [class.ng-invalid]="hasError('lastName')"
            [class.ng-dirty]="hasError('lastName')"
          />
          @if (hasError('lastName', 'required')) {
            <small class="text-red-500">El apellido es requerido</small>
          }
        </div>
      </div>

      <div class="mb-4">
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

      <div class="mb-4">
        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Contraseña
        </label>
        <input
          pInputText
          id="password"
          type="password"
          formControlName="password"
          placeholder="••••••••"
          class="w-full"
          [class.ng-invalid]="hasError('password')"
          [class.ng-dirty]="hasError('password')"
        />
        @if (hasError('password', 'required')) {
          <small class="text-red-500">La contraseña es requerida</small>
        }
        @if (hasError('password', 'minlength')) {
          <small class="text-red-500">Mínimo 6 caracteres</small>
        }
      </div>

      <div class="mb-6">
        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Confirmar Contraseña
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
          <small class="text-red-500">Confirma tu contraseña</small>
        }
        @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
          <small class="text-red-500">Las contraseñas no coinciden</small>
        }
      </div>

      <p-button
        type="submit"
        label="Registrarse"
        [loading]="isLoading"
        [disabled]="isLoading"
        styleClass="w-full"
      />

      <div class="text-center mt-6">
        <span class="text-surface-600 dark:text-surface-400">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="font-medium text-primary hover:underline">
            Inicia Sesión
          </a>
        </span>
      </div>
    </form>
  `
})
export class RegisterFormComponent {
  @Input() isLoading: boolean = false;
  @Output() submitForm = new EventEmitter<RegisterFormValue>();

  registerForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: AuthValidators.passwordMatch('password', 'confirmPassword')
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      FormUtils.markFormGroupTouched(this.registerForm);
      return;
    }

    this.submitForm.emit(this.registerForm.value);
  }

  hasError(field: string, errorType?: string): boolean {
    const control = this.registerForm.get(field);
    if (!control || !control.touched) return false;
    
    if (errorType) {
      return control.hasError(errorType);
    }
    return control.invalid;
  }
}
