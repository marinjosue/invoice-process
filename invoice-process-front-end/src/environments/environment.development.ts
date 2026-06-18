export const environment = {
  production: false,
  apiUrl: (window as any).__env?.API_URL || 'http://localhost:3000/api',
  apiTimeout: 30000,
  apiRetryAttempts: 3,
};
