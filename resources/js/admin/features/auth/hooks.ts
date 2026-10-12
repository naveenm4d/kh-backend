import { usePage } from '@inertiajs/react';
import type { Permission } from '@admin/features/auth/permissions';

/** The signed-in staff member, as the server shares it with every page. */
export interface AdminUser {
    id: string;
    name: string;
    code: string;
    email: string;
    roleName: string;
    initials: string;
    permissions: Permission[];
    twoFactorEnabled: boolean;
}

export function useCurrentUser(): AdminUser | null {
    return (
        (usePage().props as unknown as { auth?: { user: AdminUser | null } })
            .auth?.user ?? null
    );
}

/** Whether the signed-in user's role grants `permission`. The server checks again on every request. */
export function useCan(permission: Permission): boolean {
    return !!useCurrentUser()?.permissions.includes(permission);
}
