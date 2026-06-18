import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthValidators, FormUtils } from '../utils';

export interface ResetPasswordFormValue {
    password: string;
    confirmPassword: string;
}

@Component({
    selector: 'app-reset-password-form',
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
                Restablecer Contraseña
            </div>
            <span class="text-surface-600 dark:text-surface-400 font-medium">
                Ingresa tu nueva contraseña
            </span>
        </div>

        <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
            <div class="mb-4">
                <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                    Nueva Contraseña
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
                @if (resetPasswordForm.hasError('passwordMismatch') && resetPasswordForm.get('confirmPassword')?.touched) {
                    <small class="text-red-500">Las contraseñas no coinciden</small>
                }
            </div>

            <p-button
            type="submit"
            label="Restablecer Contraseña"
            [loading]="isLoading"
            [disabled]="isLoading"
            styleClass="w-full"
            />
        </form>

        <p-button
        type="button"
        label="Ir a Login"
        routerLink="/auth/login"
        styleClass="w-full p-button-secondary mt-5"
        />
    `
})
export class ResetPasswordFormComponent {
    @Input() isLoading: boolean = false;
    @Output() submitForm = new EventEmitter<ResetPasswordFormValue>();

    resetPasswordForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.resetPasswordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: AuthValidators.passwordMatch('password', 'confirmPassword')
        });
    }

    onSubmit(): void {
        if (this.resetPasswordForm.invalid) {
            FormUtils.markFormGroupTouched(this.resetPasswordForm);
            return;
        }

        this.submitForm.emit(this.resetPasswordForm.value);
    }

    hasError(field: string, errorType?: string): boolean {
        const control = this.resetPasswordForm.get(field);
        if (!control || !control.touched) return false;

        if (errorType) {
            return control.hasError(errorType);
        }
        return control.invalid;
    }
}