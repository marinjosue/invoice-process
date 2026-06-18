export const APP_CONSTANTS = {
  APP_NAME: 'Product Settlement System',
  APP_VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@settlementsystem.com',
  
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    ANALYST: 'analyst'
  },

  PLANS: {
    FREE: 'free',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise'
  },

  PRODUCT_STATUS: {
    PENDING: 'pending',
    PROCESSED: 'processed',
    REJECTED: 'rejected',
    SETTLED: 'settled'
  },

  SETTLEMENT_STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed'
  },

  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100]
  },

  DATE_FORMAT: 'yyyy-MM-dd',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  
  FILE_UPLOAD: {
    MAX_SIZE_MB: 50,
    ALLOWED_TYPES: ['application/pdf'],
    MIME_TYPES: 'application/pdf'
  }
};
