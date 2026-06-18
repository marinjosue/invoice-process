import { permissionsForRole, permissionsForRoles } from './role-permissions';

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

describe('permissionsForRoles (unión)', () => {
  it('une permisos de varios roles sin duplicados', () => {
    const r = permissionsForRoles(['user', 'viewer']);
    // user: dashboard, providers, products, inventory, invoices.upload, invoices.manage
    // viewer: dashboard, invoices.manage, settlements  -> unión añade settlements
    expect(r).toContain('settlements');
    expect(r).toContain('providers');
    expect(r.filter((x) => x === 'dashboard').length).toBe(1); // sin duplicados
  });

  it('lista vacía o roles desconocidos → []', () => {
    expect(permissionsForRoles([])).toEqual([]);
    expect(permissionsForRoles(['nope'])).toEqual([]);
  });

  it('un solo rol equivale a permissionsForRole', () => {
    expect(permissionsForRoles(['admin'])).toEqual(permissionsForRole('admin'));
  });
});
