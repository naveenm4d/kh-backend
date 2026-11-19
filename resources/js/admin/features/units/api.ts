import { http } from '@admin/shared/lib/http';
import type { Unit, UnitInput } from '@admin/features/units/types';

export const unitsApi = {
    getAll: (): Promise<Unit[]> => http.get('/units'),
    create: (input: UnitInput): Promise<Unit> => http.post('/units', input),
    update: (id: string, input: UnitInput): Promise<Unit> =>
        http.put(`/units/${id}`, input),
    delete: (id: string): Promise<void> => http.delete(`/units/${id}`),
};
