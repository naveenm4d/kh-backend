import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { customersApi } from '@admin/features/customers/api';
import type {
    CustomerInput,
    CustomerPaymentInput,
    CustomerQuery,
} from '@admin/features/customers/types';

export const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (query: CustomerQuery) => [...customerKeys.lists(), query] as const,
    detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
};

export function useCustomers(query: CustomerQuery = {}) {
    return useQuery({
        queryKey: customerKeys.list(query),
        queryFn: () => customersApi.getAll(query),
    });
}

/** Page-at-a-time customer list (A–Z) for infinite scroll. Shares the `customers` prefix, so customer mutations invalidate it too. */
export function useInfiniteCustomers(
    query: { search?: string; pageSize?: number } = {},
) {
    return useInfiniteQuery({
        queryKey: [...customerKeys.lists(), 'infinite', query] as const,
        queryFn: ({ pageParam }) =>
            customersApi.getAll({ ...query, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    });
}

export function useCustomer(id: string | undefined) {
    return useQuery({
        queryKey: customerKeys.detail(id ?? ''),
        queryFn: () => customersApi.getById(id as string),
        enabled: !!id,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CustomerInput) => customersApi.create(input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: CustomerInput }) =>
            customersApi.update(id, input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => customersApi.delete(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    });
}

/** Records a payment against a customer's credit. Outstanding credit also shows on the dashboard, so that refreshes too. */
export function useRecordPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input: CustomerPaymentInput;
        }) => customersApi.recordPayment(id, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: customerKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}
