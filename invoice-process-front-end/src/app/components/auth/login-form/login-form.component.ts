import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { FormUtils } from '../utils/FormUtils';

export interface LoginFormValue {
    email: string;
    password: string;
    rememberMe: boolean;
}

// Decorador del componente que define su configuración
@Component({
    selector: 'app-login-form', // Selector para usar el componente
    standalone: true, // Componente independiente
    imports: [ // Módulos importados
        CommonModule,
        ReactiveFormsModule,
        CheckboxModule,
        InputTextModule,
        RouterModule,
        IconFieldModule,
        InputIconModule,
        ButtonModule
    ],
    template: `
        <!-- Encabezado del formulario -->
        <div class="mb-6">
            <div class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-2">
                Sistema de Liquidaciones v2.0
            </div>
            <span class="text-surface-600 dark:text-surface-200 font-medium">
                Ingresa tus credenciales
            </span>
        </div>

        <!-- Formulario reactivo -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="flex flex-col">
                <!-- Campo de email -->
                <p-iconfield class="w-full mb-6">
                    <p-inputicon class="pi pi-envelope" />
                    <input
                        id="email"
                        type="email"
                        formControlName="email"
                        pInputText
                        class="w-full md:w-100"
                        placeholder="Correo electrónico"
                        [class.ng-invalid]="hasError('email')"
                    />
                </p-iconfield>
                <!-- Mensajes de error del email -->
                @if (hasError('email')) {
                    <small class="text-red-500 -mt-4 mb-4">
                        @if (hasError('email', 'required')) {
                            <span>El correo es requerido</span>
                        }
                        @if (hasError('email', 'email')) {
                            <span>El correo no es válido</span>
                        }
                    </small>
                }

                <!-- Campo de contraseña -->
                <p-iconfield class="w-full mb-6">
                    <p-inputicon class="pi pi-lock" />
                    <input
                        id="password"
                        type="password"
                        formControlName="password"
                        pInputText
                        class="w-full md:w-100"
                        placeholder="Contraseña"
                        [class.ng-invalid]="hasError('password')"
                    />
                </p-iconfield>
                <!-- Mensajes de error de contraseña -->
                @if (hasError('password')) {
                    <small class="text-red-500 -mt-4 mb-4">
                        @if (hasError('password', 'required')) {
                            <span>La contraseña es requerida</span>
                        }
                        @if (hasError('password', 'minlength')) {
                            <span>La contraseña debe tener al menos 6 caracteres</span>
                        }
                    </small>
                }

                <!-- Checkbox "Recuérdame" y enlace de contraseña olvidada -->
                <div class="mb-6 flex items-center justify-between">
                    <div class="flex items-center">
                        <p-checkbox 
                            formControlName="rememberMe" 
                            [binary]="true" 
                            inputId="rememberme"
                        />
                        <label for="rememberme" class="ml-2 text-surface-900 dark:text-surface-0">
                            Recuérdame
                        </label>
                    </div>
                    <a 
                        class="text-primary cursor-pointer hover:underline"
                        routerLink="/auth/forgot-password"
                    >
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>

                <!-- Botón de envío -->
                <button
                    pButton
                    pRipple
                    type="submit"
                    label="Iniciar Sesión"
                    class="w-full"
                    [loading]="isLoading"
                    [disabled]="isLoading"
                ></button>
            </div>
        </form>
    `
})
export class LoginFormComponent {
    // Entrada: Indica si el formulario se está procesando
    @Input() isLoading: boolean = false;
    // Salida: Emite los valores del formulario cuando se envía
    @Output() submitForm = new EventEmitter<LoginFormValue>();

    // Formulario reactivo
    loginForm: FormGroup;

    constructor(private fb: FormBuilder) {
        // Inicializa el formulario con sus controles y validadores
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    // Maneja el envío del formulario
    onSubmit(): void {
        if (this.loginForm.invalid) {
            // Marca todos los campos como tocados para mostrar errores
            FormUtils.markFormGroupTouched(this.loginForm);
            return;
        }

        // Emite los valores del formulario al componente padre
        this.submitForm.emit(this.loginForm.value);
    }

    // Verifica si un campo tiene errores
    hasError(field: string, errorType?: string): boolean {
        const control = this.loginForm.get(field);
        if (!control || !control.touched) return false;
        
        if (errorType) {
            return control.hasError(errorType);
        }
        return control.invalid;
    }
}
