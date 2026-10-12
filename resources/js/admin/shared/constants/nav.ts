import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    LineChart,
    Users,
    ReceiptText,
    Boxes,
    Layers,
    UserCog,
    Settings,
    KeyRound,
} from 'lucide-react';
import type { Permission } from '@admin/features/auth/permissions';

export interface NavItem {
    key: string;
    label: string;
    to: string;
    icon: LucideIcon;
    permission: Permission;
}

export interface NavSection {
    label: string;
    items: string[];
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        to: '/admin/dashboard',
        icon: LayoutDashboard,
        permission: 'page.dashboard',
    },
    {
        key: 'reports',
        label: 'Reports',
        to: '/admin/reports',
        icon: LineChart,
        permission: 'page.reports',
    },
    {
        key: 'customers',
        label: 'Customers',
        to: '/admin/customers',
        icon: Users,
        permission: 'page.customers',
    },
    {
        key: 'orders',
        label: 'Orders',
        to: '/admin/orders',
        icon: ReceiptText,
        permission: 'page.orders',
    },
    {
        key: 'inventory',
        label: 'Inventory',
        to: '/admin/inventory',
        icon: Boxes,
        permission: 'page.inventory',
    },
    {
        key: 'catalog',
        label: 'Catalog',
        to: '/admin/catalog',
        icon: Layers,
        permission: 'page.catalog',
    },
    {
        key: 'users',
        label: 'Users & roles',
        to: '/admin/users',
        icon: UserCog,
        permission: 'page.users',
    },
    {
        key: 'terminals',
        label: 'Terminals',
        to: '/admin/terminals',
        icon: KeyRound,
        permission: 'page.settings',
    },
    {
        key: 'settings',
        label: 'Settings',
        to: '/admin/settings',
        icon: Settings,
        permission: 'page.settings',
    },
];

/** Sidebar grouping for ADMIN_NAV_ITEMS, by item key. */
export const ADMIN_NAV_SECTIONS: NavSection[] = [
    { label: 'Overview', items: ['dashboard', 'reports'] },
    { label: 'Sales', items: ['orders', 'customers'] },
    { label: 'Stock', items: ['inventory', 'catalog'] },
    { label: 'Admin', items: ['users', 'terminals', 'settings'] },
];
