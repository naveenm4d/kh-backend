import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@admin/shared/components/Dialog';
import { Input } from '@admin/shared/components/Input';
import { Button } from '@admin/shared/components/Button';
import { useToast } from '@admin/shared/components/Toast';
import { customerFormSchema } from '@admin/features/customers/schemas';
import type { CustomerFormValues } from '@admin/features/customers/schemas';
import {
    useCreateCustomer,
    useUpdateCustomer,
} from '@admin/features/customers/hooks';
import type { Customer, CustomerInput } from '@admin/features/customers/types';

export interface CustomerFormModalProps {
    open: boolean;
    onClose: () => void;
    customer?: Customer | null;
    onSaved?: (customer: Customer) => void;
    /** Prefills a new customer (e.g. the phone number the cashier just searched for). Ignored when editing. */
    initialValues?: Partial<CustomerInput>;
    /** Show the credit balance field. Off in the cashier view: credit should only move through credit sales and cancellations. */
    showCredit?: boolean;
}

export function CustomerFormModal({
    open,
    onClose,
    customer,
    onSaved,
    initialValues,
    showCredit = true,
}: CustomerFormModalProps) {
    const isEdit = !!customer;
    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();
    const toast = useToast();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: { name: '', phone: '', address: '', credit: 0 },
    });

    useEffect(() => {
        if (open) {
            reset(
                customer
                    ? {
                          name: customer.name,
                          phone: customer.phone,
                          address: customer.address,
                          credit: customer.credit,
                      }
                    : {
                          name: '',
                          phone: '',
                          address: '',
                          credit: 0,
                          ...initialValues,
                      },
            );
        }
        // initialValues is only read when the form opens, so it's deliberately not a dependency.
    }, [open, customer, reset]);

    const isPending = createCustomer.isPending || updateCustomer.isPending;

    const onSubmit = handleSubmit(async (values) => {
        try {
            let saved: Customer;
            if (isEdit && customer) {
                saved = await updateCustomer.mutateAsync({
                    id: customer.id,
                    input: values,
                });
                toast.success('Customer updated');
            } else {
                saved = await createCustomer.mutateAsync(values);
                toast.success('Customer added');
            }
            onSaved?.(saved);
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
            title={isEdit ? 'Edit customer' : 'New customer'}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                <Input
                    label="Full name"
                    autoFocus
                    autoComplete="off"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <Input
                    label="Phone number (optional)"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    error={errors.phone?.message}
                    {...register('phone')}
                />
                <Input
                    label="Address (optional)"
                    autoComplete="off"
                    error={errors.address?.message}
                    {...register('address')}
                />
                {showCredit && (
                    <Input
                        label="Credit balance (Rs.)"
                        type="number"
                        step="0.01"
                        error={errors.credit?.message}
                        {...register('credit')}
                    />
                )}
                <div className="mt-1.5 flex gap-2.5">
                    <Button
                        type="submit"
                        size="lg"
                        className="flex-1 rounded-2xl"
                        isLoading={isPending}
                    >
                        {isEdit ? 'Save changes' : 'Add customer'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="flex-1 rounded-2xl"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
