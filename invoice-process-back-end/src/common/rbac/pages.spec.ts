// pages.spec.ts
import { PAGES, PAGE_KEYS, unionPerms } from './pages';
describe('pages catalog', () => {
  it('PAGE_KEYS coincide con las 9 claves', () => {
    expect(PAGE_KEYS).toEqual([
      'dashboard','providers','products','categories','inventory',
      'invoices.upload','invoices.manage','settlements','admin.users',
    ]);
  });
  it('cada page tiene key y label', () => {
    expect(PAGES.every(p => p.key && p.label)).toBe(true);
  });
  it('unionPerms une sin duplicados', () => {
    expect(unionPerms([['a','b'],['b','c']])).toEqual(['a','b','c']);
  });
});
