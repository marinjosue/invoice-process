/**
 * Constantes utilizadas en el módulo de autenticación
 */
export const AUTH_CONSTANTS = {
  /**
   * Rutas de navegación
   */
  ROUTES: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    DASHBOARD: '/dashboard'
  },

  /**
   * Mensajes de éxito
   */
  SUCCESS_MESSAGES: {
    LOGIN: 'Inicio de sesión exitoso',
    REGISTER: 'Tu cuenta ha sido creada correctamente',
    FORGOT_PASSWORD: 'Se ha enviado un enlace de recuperación a tu correo electrónico',
    RESET_PASSWORD: 'Tu contraseña ha sido restablecida correctamente',
    CHANGE_PASSWORD: 'Tu contraseña ha sido actualizada correctamente',
    LOGOUT: 'Sesión cerrada correctamente'
  },

  /**
   * Mensajes de error
   */
  ERROR_MESSAGES: {
    LOGIN_FAILED: 'Credenciales inválidas. Por favor, intenta de nuevo.',
    REGISTER_FAILED: 'No se pudo crear la cuenta. Por favor, intenta de nuevo.',
    FORGOT_PASSWORD_FAILED: 'No se pudo enviar el correo de recuperación',
    RESET_PASSWORD_FAILED: 'No se pudo restablecer la contraseña. El enlace puede haber expirado.',
    CHANGE_PASSWORD_FAILED: 'No se pudo cambiar la contraseña',
    NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
    SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde.',
    UNAUTHORIZED: 'No tienes autorización para realizar esta acción',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
  },

  /**
   * Títulos de notificaciones
   */
  NOTIFICATION_TITLES: {
    SUCCESS: 'Éxito',
    ERROR: 'Error',
    WARNING: 'Advertencia',
    INFO: 'Información',
    LOGIN_ERROR: 'Error en Inicio de Sesión',
    REGISTER_ERROR: 'Error en Registro',
    VALIDATION_ERROR: 'Error de Validación'
  },

  /**
   * Configuración de formularios
   */
  FORM_CONFIG: {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 100,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    DEBOUNCE_TIME: 300, // ms
    AUTO_REDIRECT_DELAY: 2000 // ms
  },

  /**
   * Expresiones regulares
   */
  REGEX: {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    ONLY_LETTERS: /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/,
    NO_WHITESPACE: /^\S*$/
  }
};

/**
 * Tipos de roles de usuario
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  VIEWER = 'viewer'
}

/**
 * Estados de sesión
 */
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  INVALID = 'invalid'
}
