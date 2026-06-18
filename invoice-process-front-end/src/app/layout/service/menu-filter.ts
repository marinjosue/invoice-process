export interface MenuNode {
  label?: string;
  icon?: string;
  routerLink?: any;
  permission?: string;
  separator?: boolean;
  items?: MenuNode[];
}

/** Filtra el modelo del menú dejando solo lo permitido; descarta grupos vacíos. */
export function filterMenuByPermissions(model: MenuNode[], permissions: string[]): MenuNode[] {
  const allowed = new Set(permissions ?? []);
  const walk = (nodes: MenuNode[]): MenuNode[] =>
    nodes
      .map((node): MenuNode | null => {
        if (node.items?.length) {
          const items = walk(node.items);
          return items.length ? { ...node, items } : null;
        }
        if (!node.permission || allowed.has(node.permission)) return node;
        return null;
      })
      .filter((n): n is MenuNode => n !== null);
  return walk(model);
}
