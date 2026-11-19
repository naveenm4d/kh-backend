/** Mirrors models.Permission in Go (models/role.go). The Go side enforces; the UI hides and disables. */
export type Permission =
    | 'page.dashboard'
    | 'page.reports'
    | 'page.customers'
    | 'page.orders'
    | 'page.inventory'
    | 'page.catalog'
    | 'page.users'
    | 'page.settings'
    | 'pos.access'
    | 'pos.discount'
    | 'pos.credit'
    | 'orders.edit'
    | 'orders.cancel'
    | 'customers.payment'
    | 'stock.adjust'
    | 'prices.edit'
    | 'records.delete';

export interface PermissionInfo {
    key: Permission;
    group: string;
    label: string;
    description: string;
}

/** Admin pages in nav order, with the permission that opens each. */
export const ADMIN_PAGES: { path: string; permission: Permission }[] = [
    { path: '/admin/dashboard', permission: 'page.dashboard' },
    { path: '/admin/reports', permission: 'page.reports' },
    { path: '/admin/orders', permission: 'page.orders' },
    { path: '/admin/customers', permission: 'page.customers' },
    { path: '/admin/inventory', permission: 'page.inventory' },
    { path: '/admin/catalog', permission: 'page.catalog' },
    { path: '/admin/users', permission: 'page.users' },
    { path: '/admin/settings', permission: 'page.settings' },
];

/** Where a user lands: the cashier screen if they can use it, otherwise their first admin page. */
export function homePath(perms: readonly string[]): string | null {
    if (perms.includes('pos.access')) return '/pos';
    return ADMIN_PAGES.find((p) => perms.includes(p.permission))?.path ?? null;
}

export function firstAdminPath(perms: readonly string[]): string | null {
    return ADMIN_PAGES.find((p) => perms.includes(p.permission))?.path ?? null;
}
