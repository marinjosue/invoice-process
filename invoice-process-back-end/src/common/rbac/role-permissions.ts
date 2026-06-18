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

/** Unión (sin duplicados) de los permisos de varios roles. */
export function permissionsForRoles(roles: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const role of roles ?? []) {
    for (const p of permissionsForRole(role)) {
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
  }
  return out;
}
