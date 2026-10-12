import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { usersApi } from '@admin/features/users/api';
import { router } from '@inertiajs/react';
import type { RoleInput, StaffUserInput } from '@admin/features/users/types';

const keys = {
    users: ['staff-users'] as const,
    roles: ['roles'] as const,
    permissions: ['permissions'] as const,
};

/** Any user or role change can change what the signed-in person may do, so their session refreshes too. */
function invalidateAll(qc: QueryClient) {
    void qc.invalidateQueries({ queryKey: keys.users });
    void qc.invalidateQueries({ queryKey: keys.roles });
    // The signed-in person's own permissions come with every page; refresh them in place.
    router.reload({ only: ['auth'] });
}

export function useStaffUsers() {
    return useQuery({ queryKey: keys.users, queryFn: usersApi.getAll });
}

export function useRoles() {
    return useQuery({ queryKey: keys.roles, queryFn: usersApi.getRoles });
}

export function usePermissionCatalog() {
    return useQuery({
        queryKey: keys.permissions,
        queryFn: usersApi.getPermissions,
        staleTime: Infinity,
    });
}

export function useCreateStaffUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: StaffUserInput) => usersApi.create(input),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useUpdateStaffUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: StaffUserInput }) =>
            usersApi.update(id, input),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useDeleteStaffUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersApi.delete(id),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: ({ id, password }: { id: string; password: string }) =>
            usersApi.resetPassword(id, password),
    });
}

export function useCreateRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: RoleInput) => usersApi.createRole(input),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useUpdateRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: RoleInput }) =>
            usersApi.updateRole(id, input),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useDeleteRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersApi.deleteRole(id),
        onSuccess: () => invalidateAll(qc),
    });
}
