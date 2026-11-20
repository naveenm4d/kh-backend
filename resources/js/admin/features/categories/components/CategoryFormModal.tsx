import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@admin/shared/components/Dialog';
import { Input } from '@admin/shared/components/Input';
import { Select } from '@admin/shared/components/Select';
import { Button } from '@admin/shared/components/Button';
import { useToast } from '@admin/shared/components/Toast';
import { categoryFormSchema } from '@admin/features/categories/schemas';
import type { CategoryFormValues } from '@admin/features/categories/schemas';
import { GROUP_NAMES } from '@admin/features/categories/constants';
import {
    useCreateCategory,
    useUpdateCategory,
} from '@admin/features/categories/hooks';
import type { Category } from '@admin/features/categories/types';

export interface CategoryFormModalProps {
    open: boolean;
    onClose: () => void;
    category?: Category | null;
}

export function CategoryFormModal({
    open,
    onClose,
    category,
}: CategoryFormModalProps) {
    const isEdit = !!category;
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const toast = useToast();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: { name: '', parent: '', group: GROUP_NAMES[0] },
    });

    useEffect(() => {
        if (open)
            reset(
                category
                    ? {
                          name: category.name,
                          parent: category.parent,
                          group: category.group as (typeof GROUP_NAMES)[number],
                      }
                    : { name: '', parent: '', group: GROUP_NAMES[0] },
            );
    }, [open, category, reset]);

    const isPending = createCategory.isPending || updateCategory.isPending;

    const onSubmit = handleSubmit(async (values) => {
        try {
            if (isEdit && category) {
                await updateCategory.mutateAsync({
                    id: category.id,
                    input: values,
                });
                toast.success('Category updated');
            } else {
                await createCategory.mutateAsync(values);
                toast.success('Category added');
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
            title={isEdit ? 'Edit category' : 'New category'}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                <Input
                    label="Category name"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <Input
                    label="Parent group"
                    error={errors.parent?.message}
                    {...register('parent')}
                />
                <Select
                    label="Product group (used for icon color)"
                    error={errors.group?.message}
                    options={GROUP_NAMES.map((g) => ({ value: g, label: g }))}
                    {...register('group')}
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
