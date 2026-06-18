import { FormGroup, FormControl, AbstractControl } from '@angular/forms';

export class FormUtils {
  static markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  static resetFormGroup(formGroup: FormGroup): void {
    formGroup.reset();
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.setErrors(null);
    });
  }

  static getAllErrors(formGroup: FormGroup): { [key: string]: any } {
    const errors: { [key: string]: any } = {};

    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        const nestedErrors = this.getAllErrors(control);
        if (Object.keys(nestedErrors).length > 0) {
          errors[key] = nestedErrors;
        }
      } else if (control?.errors) {
        errors[key] = control.errors;
      }
    });

    return errors;
  }

  static getFirstError(control: AbstractControl | null): string | null {
    if (!control || !control.errors) {
      return null;
    }

    const errorKey = Object.keys(control.errors)[0];
    return errorKey;
  }
}
