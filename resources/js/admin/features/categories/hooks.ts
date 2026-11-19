import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@admin/features/categories/api';
import type { CategoryInput } from '@admin/features/categories/types';

const categoryKeys = {
    all: ['categories'] as const,
};

export function useCategories() {
    return useQuery({
        queryKey: categoryKeys.all,
        queryFn: categoriesApi.getAll,
        staleTime: 60_000,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CategoryInput) => categoriesApi.create(input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
            categoriesApi.update(id, input),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    });
}
