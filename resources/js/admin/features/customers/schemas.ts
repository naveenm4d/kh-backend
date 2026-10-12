import { z } from 'zod';

export const customerFormSchema = z.object({
    name: z.string().trim().min(1, 'Full name is required'),
    // Only the name is required; a phone number, when given, must look like one.
    phone: z
        .string()
        .trim()
        .refine((v) => v === '' || v.length >= 9, 'Enter a valid phone number'),
    address: z.string().trim(),
    credit: z.coerce
        .number({ invalid_type_error: 'Enter a valid amount' })
        .min(0, 'Credit cannot be negative'),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
