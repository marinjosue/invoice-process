
/** Única fuente de verdad de la matriz rol → claves de pestaña. */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'dashboard', 'providers', 'products', 'categories', 'inventory',
    'invoices.upload', 'invoices.manage', 'settlements', 'admin.users',
  ],
  manager: [
    'dashboard', 'providers', 'products', 'categories', 'inventory',
    'invoices.upload', 'invoices.manage', 'settlements',
  ],
  user: [
    'dashboard', 'providers', 'products', 'inventory',
    'invoices.upload', 'invoices.manage',
  ],
  viewer: ['dashboard', 'invoices.manage', 'settlements'],
};

export function permissionsForRole(role?: string): string[] {
  return ROLE_PERMISSIONS[role ?? ''] ?? [];
}
