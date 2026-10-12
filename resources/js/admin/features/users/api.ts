import { http } from '@admin/shared/lib/http';
import type {
    PermissionInfo,
    Role,
    RoleInput,
    StaffUser,
    StaffUserInput,
} from '@admin/features/users/types';

export const usersApi = {
    getAll: (): Promise<StaffUser[]> => http.get('/staff'),
    create: (input: StaffUserInput): Promise<StaffUser> =>
        http.post('/staff', input),
    update: (id: string, input: StaffUserInput): Promise<StaffUser> => {
        // The password is only sent when creating; it's reset separately.
        const { password: _password, ...rest } = input;
        return http.put(`/staff/${id}`, rest);
    },
    delete: (id: string): Promise<void> => http.delete(`/staff/${id}`),
    resetPassword: (id: string, password: string): Promise<void> =>
        http.post(`/staff/${id}/password`, { password }),
    getRoles: (): Promise<Role[]> => http.get('/roles'),
    createRole: (input: RoleInput): Promise<Role> => http.post('/roles', input),
    updateRole: (id: string, input: RoleInput): Promise<Role> =>
        http.put(`/roles/${id}`, input),
    deleteRole: (id: string): Promise<void> => http.delete(`/roles/${id}`),
    getPermissions: (): Promise<PermissionInfo[]> => http.get('/permissions'),
};
