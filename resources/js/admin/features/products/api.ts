import { http } from '@admin/shared/lib/http';
import type { Paginated } from '@admin/shared/types/common';
import type {
    Brand,
    BrandInput,
    Product,
    ProductInput,
    ProductQuery,
} from '@admin/features/products/types';

export const productsApi = {
    getAll: (query: ProductQuery = {}): Promise<Paginated<Product>> =>
        http.get('/products', { ...query }),
    getById: (id: string): Promise<Product> => http.get(`/products/${id}`),
    create: (input: ProductInput): Promise<Product> =>
        http.post('/products', input),
    update: (id: string, input: ProductInput): Promise<Product> =>
        http.put(`/products/${id}`, input),
    delete: (id: string): Promise<void> => http.delete(`/products/${id}`),
    /** Adds a delivery to stock on the server, so two people receiving at once both count. */
    receive: (id: string, qty: number, note = ''): Promise<Product> =>
        http.post(`/products/${id}/receive`, { qty, note }),
    getBrands: (): Promise<Brand[]> => http.get('/brands'),
    createBrand: (input: BrandInput): Promise<Brand> =>
        http.post('/brands', input),
    updateBrand: (id: string, input: BrandInput): Promise<Brand> =>
        http.put(`/brands/${id}`, input),
    deleteBrand: (id: string): Promise<void> => http.delete(`/brands/${id}`),
};
