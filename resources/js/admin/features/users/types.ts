import type {
    Permission,
    PermissionInfo,
} from '@admin/features/auth/permissions';
import type { UserRole } from '@admin/features/auth/types';

export type { Permission, PermissionInfo };

export interface StaffUser {
    id: string;
    name: string;
    /** Printed on bills instead of the name: lowercase letters and hyphens, unique (see code.ts). */
    code: string;
    email: string;
    role: UserRole;
    phone: string;
    initials: string;
    active: boolean;
}

export interface StaffUserInput {
    name: string;
    code: string;
    email: string;
    role: UserRole;
    phone: string;
    active: boolean;
    /** Required when creating; ignored on update (use resetPassword). */
    password?: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    /** Built-in: can't be deleted. */
    system: boolean;
    /** Always has every permission. */
    locked: boolean;
}

export interface RoleInput {
    name: string;
    description: string;
    permissions: Permission[];
}
