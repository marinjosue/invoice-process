export const environment = {
  production: false,
  apiUrl: (window as any).__env?.API_URL || 'https://api.devsje.dev/api',
  apiTimeout: 30000,
  apiRetryAttempts: 3,
};
