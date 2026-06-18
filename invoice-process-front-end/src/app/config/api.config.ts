import { environment } from '../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  timeout: environment.apiTimeout,
  retryAttempts: environment.apiRetryAttempts,
  version: 'v1'
};
