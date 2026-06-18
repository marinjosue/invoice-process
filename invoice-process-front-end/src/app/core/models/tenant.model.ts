export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  logo?: string;
  description?: string;
  plan?: 'free' | 'professional' | 'enterprise';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantSettings {
  tenantId: string;
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  language: 'en' | 'es';
}
