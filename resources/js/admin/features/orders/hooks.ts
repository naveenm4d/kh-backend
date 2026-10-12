import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { ordersApi } from '@admin/features/orders/api';
import type {
    CreateOrderItemInput,
    OrderQuery,
} from '@admin/features/orders/types';

export const orderKeys = {
    all: ['orders'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    list: (query: OrderQuery) => [...orderKeys.lists(), query] as const,
    detail: (invoice: string) => [...orderKeys.all, 'detail', invoice] as const,
};

export function useOrders(query: OrderQuery = {}) {
    return useQuery({
        queryKey: orderKeys.list(query),
        queryFn: () => ordersApi.getAll(query),
    });
}

/** Page-at-a-time order list for infinite scroll. Shares the `lists()` prefix, so order mutations invalidate it too. */
export function useInfiniteOrders(query: Omit<OrderQuery, 'page'> = {}) {
    return useInfiniteQuery({
        queryKey: [...orderKeys.lists(), 'infinite', query] as const,
        queryFn: ({ pageParam }) =>
            ordersApi.getAll({ ...query, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    });
}

export function useOrder(invoice: string | undefined) {
    return useQuery({
        queryKey: orderKeys.detail(invoice ?? ''),
        queryFn: () => ordersApi.getById(invoice as string),
        enabled: !!invoice,
    });
}

export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (invoice: string) => ordersApi.cancel(invoice),
        onSuccess: (order) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            void queryClient.invalidateQueries({
                queryKey: orderKeys.detail(order.invoice),
            });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useIssueOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (invoice: string) => ordersApi.issue(invoice),
        onSuccess: (order) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            void queryClient.invalidateQueries({
                queryKey: orderKeys.detail(order.invoice),
            });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useUpdateOrderItems() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            invoice,
            items,
        }: {
            invoice: string;
            items: CreateOrderItemInput[];
        }) => ordersApi.updateItems(invoice, items),
        onSuccess: (order) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            void queryClient.invalidateQueries({
                queryKey: orderKeys.detail(order.invoice),
            });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
