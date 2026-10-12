import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { unitsApi } from '@admin/features/units/api';
import { productKeys } from '@admin/features/products/hooks';
import type { UnitInput } from '@admin/features/units/types';

const unitKeys = { all: ['units'] as const };

/** A unit's name and decimals show on every product sold by it. */
function invalidate(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: unitKeys.all });
    void queryClient.invalidateQueries({ queryKey: productKeys.all });
}

export function useUnits() {
    return useQuery({
        queryKey: unitKeys.all,
        queryFn: unitsApi.getAll,
        staleTime: 60_000,
    });
}

export function useCreateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UnitInput) => unitsApi.create(input),
        onSuccess: () => invalidate(queryClient),
    });
}

export function useUpdateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UnitInput }) =>
            unitsApi.update(id, input),
        onSuccess: () => invalidate(queryClient),
    });
}

export function useDeleteUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => unitsApi.delete(id),
        onSuccess: () => invalidate(queryClient),
    });
}
