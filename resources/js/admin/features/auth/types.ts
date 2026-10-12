import type { Permission } from '@admin/features/auth/permissions';

/** A role ID. 'admin' and 'cashier' are the built-in roles; custom roles get generated IDs. */
export type UserRole = string;

export interface User {
    id: string;
    name: string;
    /** Cashier code printed on bills. */
    code: string;
    email: string;
    role: UserRole;
    roleName: string;
    initials: string;
    permissions: Permission[];
}

/** Sign in by tapping a name (userId) or by email. */
export interface LoginPayload {
    userId?: string;
    email: string;
    password: string;
}

/** What the sign-in screen may show before anyone signs in. */
export interface SignInAccount {
    id: string;
    name: string;
    code: string;
    initials: string;
}

export interface Session {
    accessToken: string;
    refreshToken: string;
    user: User;
}
