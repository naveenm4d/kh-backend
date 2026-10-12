import { http } from '@admin/shared/lib/http';
import type { Paginated } from '@admin/shared/types/common';
import type {
    CreateOrderItemInput,
    Order,
    OrderQuery,
} from '@admin/features/orders/types';

const path = (invoice: string) => `/orders/${encodeURIComponent(invoice)}`;

export const ordersApi = {
    getAll: (query: OrderQuery = {}): Promise<Paginated<Order>> =>
        http.get('/orders', { ...query }),
    getById: (invoice: string): Promise<Order> => http.get(path(invoice)),
    cancel: (invoice: string): Promise<Order> =>
        http.post(`${path(invoice)}/cancel`),
    issue: (invoice: string): Promise<Order> =>
        http.post(`${path(invoice)}/issue`),
    updateItems: (
        invoice: string,
        items: CreateOrderItemInput[],
    ): Promise<Order> => http.put(`${path(invoice)}/items`, { items }),
};
