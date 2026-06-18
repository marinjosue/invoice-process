export const AUTH_CONSTANTS = {
  ROUTES: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    DASHBOARD: '/dashboard'
  },
  
  NOTIFICATION_TITLES: {
    SUCCESS: 'Éxito',
    ERROR: 'Error',
    LOGIN_ERROR: 'Error de Inicio de Sesión',
    REGISTER_ERROR: 'Error de Registro',
    PASSWORD_ERROR: 'Error de Contraseña'
  },

  SUCCESS_MESSAGES: {
    LOGIN: 'Inicio de sesión exitoso',
    REGISTER: 'Registro exitoso. Bienvenido!',
    PASSWORD_RESET_EMAIL: 'Se ha enviado un correo para restablecer tu contraseña',
    PASSWORD_CHANGED: 'Contraseña cambiada exitosamente'
  },

  ERROR_MESSAGES: {
    LOGIN_FAILED: 'Credenciales inválidas',
    REGISTER_FAILED: 'Error al crear la cuenta',
    EMAIL_NOT_FOUND: 'Email no encontrado',
    PASSWORD_CHANGE_FAILED: 'Error al cambiar la contraseña',
    INVALID_TOKEN: 'Token inválido o expirado'
  },

  VALIDATION_MESSAGES: {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_EMAIL: 'Email inválido',
    PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 6 caracteres',
    PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
    WEAK_PASSWORD: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
  },

  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/
  }
};
