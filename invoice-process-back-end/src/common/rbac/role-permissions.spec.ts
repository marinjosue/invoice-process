import { permissionsForRole } from './role-permissions';

describe('permissionsForRole', () => {
  it('admin tiene todas las claves', () => {
    expect(permissionsForRole('admin')).toEqual([
      'dashboard', 'providers', 'products', 'categories', 'inventory',
      'invoices.upload', 'invoices.manage', 'settlements', 'admin.users',
    ]);
  });

  it('viewer solo ve dashboard, gestión de facturas y liquidaciones', () => {
    expect(permissionsForRole('viewer')).toEqual([
      'dashboard', 'invoices.manage', 'settlements',
    ]);
  });

  it('user no ve categorías ni liquidaciones', () => {
    const perms = permissionsForRole('user');
    expect(perms).toContain('invoices.upload');
    expect(perms).not.toContain('categories');
    expect(perms).not.toContain('settlements');
  });

  it('rol desconocido o ausente devuelve []', () => {
    expect(permissionsForRole('superman')).toEqual([]);
    expect(permissionsForRole(undefined)).toEqual([]);
  });
});
