import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validators personalizados para formularios de autenticación
 */
export class AuthValidators {
  /**
   * Valida que dos contraseñas coincidan
   */
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordField);
      const confirmPassword = formGroup.get(confirmPasswordField);

      if (!password || !confirmPassword) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }

      // Limpiar error si las contraseñas coinciden
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }

      return null;
    };
  }

  /**
   * Valida la fortaleza de la contraseña
   * - Mínimo 8 caracteres
   * - Al menos una mayúscula
   * - Al menos una minúscula
   * - Al menos un número
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasMinLength = value.length >= 8;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasMinLength;

      return passwordValid ? null : {
        strongPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasMinLength
        }
      };
    };
  }

  /**
   * Valida formato de email con regex más estricto
   */
  static emailFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const valid = emailRegex.test(value);

      return valid ? null : { emailFormat: true };
    };
  }

  /**
   * Valida que no contenga espacios
   */
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasWhitespace = /\s/.test(value);

      return hasWhitespace ? { noWhitespace: true } : null;
    };
  }
}
