import { z } from 'zod';

export const productFormSchema = z
    .object({
        name: z.string().min(1, 'Product name is required'),
        brand: z.string().min(1, 'Select a brand'),
        category: z.string().min(1, 'Select a category'),
        unit: z.string().min(1, 'Select a unit'),
        price: z.coerce
            .number({ invalid_type_error: 'Enter a valid price' })
            .min(0, 'Price cannot be negative'),
        displayPrice: z.coerce
            .number({ invalid_type_error: 'Enter a valid price' })
            .min(0, 'Price cannot be negative'),
        stock: z.coerce
            .number({ invalid_type_error: 'Enter a valid stock count' })
            .min(0, 'Stock cannot be negative'),
    })
    .refine((v) => v.displayPrice === 0 || v.displayPrice >= v.price, {
        message: 'Must be 0 or at least the selling price',
        path: ['displayPrice'],
    });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const brandFormSchema = z.object({
    name: z.string().min(1, 'Brand name is required'),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;
