import { http } from '@admin/shared/lib/http';
import type { Supplier, SupplierInput } from '@admin/features/suppliers/types';

export const suppliersApi = {
    getAll: (): Promise<Supplier[]> => http.get('/suppliers'),
    create: (input: SupplierInput): Promise<Supplier> =>
        http.post('/suppliers', input),
    update: (id: string, input: SupplierInput): Promise<Supplier> =>
        http.put(`/suppliers/${id}`, input),
    delete: (id: string): Promise<void> => http.delete(`/suppliers/${id}`),
};
