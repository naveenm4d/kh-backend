import { http } from '@admin/shared/lib/http';
import type { Paginated } from '@admin/shared/types/common';
import type {
    Customer,
    CustomerDetail,
    CustomerInput,
    CustomerPayment,
    CustomerPaymentInput,
    CustomerQuery,
    CustomerWithStats,
} from '@admin/features/customers/types';

export const customersApi = {
    getAll: (
        query: CustomerQuery = {},
    ): Promise<Paginated<CustomerWithStats>> =>
        http.get('/customers', { ...query }),
    getById: (id: string): Promise<CustomerDetail> =>
        http.get(`/customers/${id}`),
    create: (input: CustomerInput): Promise<Customer> =>
        http.post('/customers', input),
    update: (id: string, input: CustomerInput): Promise<Customer> =>
        http.put(`/customers/${id}`, input),
    delete: (id: string): Promise<void> => http.delete(`/customers/${id}`),
    recordPayment: (
        id: string,
        input: CustomerPaymentInput,
    ): Promise<CustomerPayment> =>
        http.post(`/customers/${id}/payments`, input),
};
