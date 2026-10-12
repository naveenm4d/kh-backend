import { z } from 'zod';

export const supplierFormSchema = z.object({
    name: z.string().min(1, 'Supplier name is required'),
    supplies: z.string().min(1, 'List what this supplier provides'),
    phone: z.string().min(1, 'Phone number is required'),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
