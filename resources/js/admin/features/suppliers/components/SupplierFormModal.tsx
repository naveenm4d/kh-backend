import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@admin/shared/components/Dialog';
import { Input } from '@admin/shared/components/Input';
import { Button } from '@admin/shared/components/Button';
import { useToast } from '@admin/shared/components/Toast';
import { supplierFormSchema } from '@admin/features/suppliers/schemas';
import type { SupplierFormValues } from '@admin/features/suppliers/schemas';
import {
    useCreateSupplier,
    useUpdateSupplier,
} from '@admin/features/suppliers/hooks';
import type { Supplier } from '@admin/features/suppliers/types';

export interface SupplierFormModalProps {
    open: boolean;
    onClose: () => void;
    supplier?: Supplier | null;
}

export function SupplierFormModal({
    open,
    onClose,
    supplier,
}: SupplierFormModalProps) {
    const isEdit = !!supplier;
    const createSupplier = useCreateSupplier();
    const updateSupplier = useUpdateSupplier();
    const toast = useToast();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierFormSchema),
        defaultValues: { name: '', supplies: '', phone: '' },
    });

    useEffect(() => {
        if (open)
            reset(
                supplier
                    ? {
                          name: supplier.name,
                          supplies: supplier.supplies,
                          phone: supplier.phone,
                      }
                    : { name: '', supplies: '', phone: '' },
            );
    }, [open, supplier, reset]);

    const isPending = createSupplier.isPending || updateSupplier.isPending;

    const onSubmit = handleSubmit(async (values) => {
        try {
            if (isEdit && supplier) {
                await updateSupplier.mutateAsync({
                    id: supplier.id,
                    input: values,
                });
                toast.success('Supplier updated');
            } else {
                await createSupplier.mutateAsync(values);
                toast.success('Supplier added');
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
            title={isEdit ? 'Edit supplier' : 'New supplier'}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                <Input
                    label="Supplier name"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <Input
                    label="Supplies (e.g. Cement, Steel)"
                    error={errors.supplies?.message}
                    {...register('supplies')}
                />
                <Input
                    label="Phone number"
                    error={errors.phone?.message}
                    {...register('phone')}
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
