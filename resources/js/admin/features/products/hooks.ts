import {
    useInfiniteQuery,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { productsApi } from '@admin/features/products/api';
import type {
    BrandInput,
    Product,
    ProductInput,
    ProductQuery,
} from '@admin/features/products/types';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (query: ProductQuery) => [...productKeys.lists(), query] as const,
    detail: (id: string) => [...productKeys.all, 'detail', id] as const,
    brands: ['brands'] as const,
};

export function useProducts(query: ProductQuery = {}) {
    return useQuery({
        queryKey: productKeys.list(query),
        queryFn: () => productsApi.getAll(query),
    });
}

/** Page-at-a-time product list for infinite scroll. Shares the `lists()` prefix, so product/order mutations invalidate it too. */
export function useInfiniteProducts(query: Omit<ProductQuery, 'page'> = {}) {
    return useInfiniteQuery({
        queryKey: [...productKeys.lists(), 'infinite', query] as const,
        queryFn: ({ pageParam }) =>
            productsApi.getAll({ ...query, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    });
}

/** Fetches just these products by id (one cached query each), keyed by id. Missing ids are still loading. */
export function useProductsByIds(ids: string[]): Map<string, Product> {
    return useQueries({
        queries: ids.map((id) => ({
            queryKey: productKeys.detail(id),
            queryFn: () => productsApi.getById(id),
        })),
        combine: (results) => {
            const map = new Map<string, Product>();
            for (const r of results) if (r.data) map.set(r.data.id, r.data);
            return map;
        },
    });
}

export function useProduct(id: string | undefined) {
    return useQuery({
        queryKey: productKeys.detail(id ?? ''),
        queryFn: () => productsApi.getById(id as string),
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ProductInput) => productsApi.create(input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: ProductInput }) =>
            productsApi.update(id, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: productKeys.all });
            // Stock changes move the dashboard's low-stock list.
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

/** Adds delivered units on the server (stock += qty), so it never overwrites a sale made meanwhile. */
export function useReceiveStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            qty,
            note,
        }: {
            id: string;
            qty: number;
            note?: string;
        }) => productsApi.receive(id, qty, note),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: productKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => productsApi.delete(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: productKeys.all }),
    });
}

export function useBrands() {
    return useQuery({
        queryKey: productKeys.brands,
        queryFn: productsApi.getBrands,
        staleTime: 60_000,
    });
}

export function useCreateBrand() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: BrandInput) => productsApi.createBrand(input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: productKeys.brands }),
    });
}

export function useUpdateBrand() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: BrandInput }) =>
            productsApi.updateBrand(id, input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: productKeys.brands }),
    });
}

export function useDeleteBrand() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => productsApi.deleteBrand(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: productKeys.brands }),
    });
}
