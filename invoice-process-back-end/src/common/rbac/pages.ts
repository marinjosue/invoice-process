export const PAGES: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'providers', label: 'Proveedores' },
  { key: 'products', label: 'Productos' },
  { key: 'categories', label: 'Categorías' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'invoices.upload', label: 'Cargar Facturas' },
  { key: 'invoices.manage', label: 'Gestión de Facturas' },
  { key: 'settlements', label: 'Liquidaciones' },
  { key: 'admin.users', label: 'Usuarios (Administración)' },
];
export const PAGE_KEYS: string[] = PAGES.map((p) => p.key);

/** Unión sin duplicados, preservando orden. */
export function unionPerms(lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) for (const k of list) if (!seen.has(k)) { seen.add(k); out.push(k); }
  return out;
}
