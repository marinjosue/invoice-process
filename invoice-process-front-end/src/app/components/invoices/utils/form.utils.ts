import { FormGroup } from '@angular/forms';

/**
 * Utilidades para manejo de formularios
 */
export class FormUtils {
  /**
   * Marca todos los controles del formulario como touched
   * Útil para mostrar errores de validación
   */
  static markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Resetea el formulario y limpia todos los errores
   */
  static resetFormGroup(formGroup: FormGroup): void {
    formGroup.reset();
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.setErrors(null);
    });
  }

  /**
   * Obtiene todos los errores del formulario en un array
   */
  static getAllErrors(formGroup: FormGroup): Array<{ field: string; errors: any }> {
    const errors: Array<{ field: string; errors: any }> = [];

    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      const controlErrors = control?.errors;

      if (controlErrors) {
        errors.push({
          field: key,
          errors: controlErrors
        });
      }
    });

    return errors;
  }

  /**
   * Verifica si el formulario tiene al menos un campo tocado
   */
  static hasAnyTouched(formGroup: FormGroup): boolean {
    return Object.keys(formGroup.controls).some(key => {
      return formGroup.get(key)?.touched;
    });
  }

  /**
   * Obtiene el primer error del formulario
   */
  static getFirstError(formGroup: FormGroup): string | null {
    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);
      const errors = control?.errors;

      if (errors && control?.touched) {
        const errorKey = Object.keys(errors)[0];
        return this.getErrorMessage(key, errorKey, errors[errorKey]);
      }
    }

    return null;
  }

  /**
   * Genera mensaje de error legible
   */
  private static getErrorMessage(field: string, errorKey: string, errorValue: any): string {
    const fieldNames: Record<string, string> = {
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      firstName: 'Nombre',
      lastName: 'Apellido'
    };

    const fieldName = fieldNames[field] || field;

    const errorMessages: Record<string, string> = {
      required: `${fieldName} es requerido`,
      email: `${fieldName} no es válido`,
      minlength: `${fieldName} debe tener al menos ${errorValue.requiredLength} caracteres`,
      maxlength: `${fieldName} no debe exceder ${errorValue.requiredLength} caracteres`,
      passwordMismatch: 'Las contraseñas no coinciden',
      emailFormat: 'El formato del correo no es válido',
      noWhitespace: `${fieldName} no puede contener espacios`
    };

    return errorMessages[errorKey] || `Error de validación en ${fieldName}`;
  }
}
