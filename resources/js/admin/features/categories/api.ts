import { http } from '@admin/shared/lib/http';
import type { Category, CategoryInput } from '@admin/features/categories/types';

export const categoriesApi = {
    getAll: (): Promise<Category[]> => http.get('/categories'),
    create: (input: CategoryInput): Promise<Category> =>
        http.post('/categories', input),
    update: (id: string, input: CategoryInput): Promise<Category> =>
        http.put(`/categories/${id}`, input),
    delete: (id: string): Promise<void> => http.delete(`/categories/${id}`),
};
