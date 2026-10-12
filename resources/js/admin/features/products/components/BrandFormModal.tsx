import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@admin/shared/components/Dialog';
import { Input } from '@admin/shared/components/Input';
import { Button } from '@admin/shared/components/Button';
import { useToast } from '@admin/shared/components/Toast';
import { brandFormSchema } from '@admin/features/products/schemas';
import type { BrandFormValues } from '@admin/features/products/schemas';
import { useCreateBrand, useUpdateBrand } from '@admin/features/products/hooks';
import type { Brand } from '@admin/features/products/types';

export interface BrandFormModalProps {
    open: boolean;
    onClose: () => void;
    brand?: Brand | null;
}

export function BrandFormModal({ open, onClose, brand }: BrandFormModalProps) {
    const isEdit = !!brand;
    const createBrand = useCreateBrand();
    const updateBrand = useUpdateBrand();
    const toast = useToast();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BrandFormValues>({
        resolver: zodResolver(brandFormSchema),
        defaultValues: { name: '' },
    });

    useEffect(() => {
        if (open) reset({ name: brand?.name ?? '' });
    }, [open, brand, reset]);

    const isPending = createBrand.isPending || updateBrand.isPending;

    const onSubmit = handleSubmit(async (values) => {
        try {
            if (isEdit && brand) {
                await updateBrand.mutateAsync({ id: brand.id, input: values });
                toast.success('Brand updated');
            } else {
                await createBrand.mutateAsync(values);
                toast.success('Brand added');
            }
            onClose();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Something went wrong',
            );
        }
    });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit brand' : 'New brand'}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                <Input
                    label="Brand name"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <div className="mt-1.5 flex gap-2.5">
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isPending}
                    >
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
