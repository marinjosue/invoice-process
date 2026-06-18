import { filterMenuByPermissions, MenuNode } from './menu-filter';

const model: MenuNode[] = [
  { label: 'Inicio', items: [{ label: 'Dashboard', permission: 'dashboard', routerLink: ['/dashboard'] }] },
  {
    label: 'Gestión',
    items: [
      { label: 'Proveedores', permission: 'providers', routerLink: ['/providers'] },
      { label: 'Categorías', permission: 'categories', routerLink: ['/categories'] },
    ],
  },
];

describe('filterMenuByPermissions', () => {
  it('deja solo los items permitidos', () => {
    const out = filterMenuByPermissions(model, ['dashboard', 'providers']);
    expect(out.length).toBe(2);
    expect(out[1].items!.map(i => i.label)).toEqual(['Proveedores']); // Categorías fuera
  });

  it('elimina grupos que quedan vacíos', () => {
    const out = filterMenuByPermissions(model, ['dashboard']);
    expect(out.map(g => g.label)).toEqual(['Inicio']); // Gestión desaparece
  });

  it('sin permisos devuelve vacío', () => {
    expect(filterMenuByPermissions(model, [])).toEqual([]);
  });

  it('items sin permission siempre se conservan', () => {
    const m: MenuNode[] = [{ label: 'Libre', items: [{ label: 'X', routerLink: ['/x'] }] }];
    expect(filterMenuByPermissions(m, [])).toEqual(m);
  });
});
