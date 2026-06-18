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

  it('manager tiene gestión + operación sin administración', () => {
    expect(permissionsForRole('manager')).toEqual([
      'dashboard', 'providers', 'products', 'categories', 'inventory',
      'invoices.upload', 'invoices.manage', 'settlements',
    ]);
  });

  it('user es operador de facturas (sin categorías ni liquidaciones)', () => {
    expect(permissionsForRole('user')).toEqual([
      'dashboard', 'providers', 'products', 'inventory',
      'invoices.upload', 'invoices.manage',
    ]);
  });

  it('rol desconocido o ausente devuelve []', () => {
    expect(permissionsForRole('superman')).toEqual([]);
    expect(permissionsForRole(undefined)).toEqual([]);
  });
});
