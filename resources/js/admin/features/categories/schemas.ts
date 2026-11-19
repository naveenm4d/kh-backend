import { z } from 'zod';
import { GROUP_NAMES } from '@admin/features/categories/constants';

export const categoryFormSchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    parent: z.string().min(1, 'Parent group is required'),
    group: z.enum(GROUP_NAMES),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
