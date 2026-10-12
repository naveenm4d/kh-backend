import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@admin/features/suppliers/api';
import type { SupplierInput } from '@admin/features/suppliers/types';

const supplierKeys = { all: ['suppliers'] as const };

export function useSuppliers() {
    return useQuery({
        queryKey: supplierKeys.all,
        queryFn: suppliersApi.getAll,
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: SupplierInput) => suppliersApi.create(input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
    });
}

export function useUpdateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: SupplierInput }) =>
            suppliersApi.update(id, input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => suppliersApi.delete(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
    });
}
