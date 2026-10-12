import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@admin/shared/components/Dialog';
import { Input } from '@admin/shared/components/Input';
import { Select } from '@admin/shared/components/Select';
import { Button } from '@admin/shared/components/Button';
import { useToast } from '@admin/shared/components/Toast';
import { productFormSchema } from '@admin/features/products/schemas';
import { qtyError, qtyStep } from '@admin/shared/utils/units';
import { useUnits } from '@admin/features/units/hooks';
import type { ProductFormValues } from '@admin/features/products/schemas';
import {
    useBrands,
    useCategories,
    useCreateProduct,
    useUpdateProduct,
} from '@admin/features/inventory/hooks';
import type { Product } from '@admin/features/products/types';

export interface ProductFormModalProps {
    open: boolean;
    onClose: () => void;
    product?: Product | null;
}

export function ProductFormModal({
    open,
    onClose,
    product,
}: ProductFormModalProps) {
    const isEdit = !!product;
    const { data: brands = [] } = useBrands();
    const { data: categories = [] } = useCategories();
    const { data: units = [] } = useUnits();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const toast = useToast();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: '',
            brand: '',
            category: '',
            unit: 'Piece',
            price: 0,
            displayPrice: 0,
            stock: 0,
        },
    });

    useEffect(() => {
        if (open) {
            reset(
                product
                    ? {
                          name: product.name,
                          brand: product.brand,
                          category: product.category,
                          unit: product.unit,
                          price: product.price,
                          displayPrice: product.displayPrice,
                          stock: product.stock,
                      }
                    : {
                          name: '',
                          brand: brands[0]?.name ?? '',
                          category: categories[0]?.name ?? '',
                          unit:
                              units.find((u) => u.name === 'Piece')?.name ??
                              units[0]?.name ??
                              '',
                          price: 0,
                          displayPrice: 0,
                          stock: 0,
                      },
            );
        }
    }, [open, product, brands, categories, units, reset]);

    const isPending = createProduct.isPending || updateProduct.isPending;
    const unit = watch('unit');
    const selectedUnit = units.find((u) => u.name === unit);
    const decimals = selectedUnit?.decimals ?? 0;

    const onSubmit = handleSubmit(async (values) => {
        // Counted units take whole numbers; measured ones up to the unit's decimals.
        const stockError = qtyError(values.stock, decimals);
        if (stockError) {
            setError('stock', { message: stockError });
            return;
        }
        try {
            if (isEdit && product) {
                await updateProduct.mutateAsync({
                    id: product.id,
                    input: values,
                });
                toast.success('Product updated');
            } else {
                await createProduct.mutateAsync(values);
                toast.success('Product added');
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
            title={isEdit ? 'Edit product' : 'Add product'}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                <Input
                    label="Product name"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Brand"
                        error={errors.brand?.message}
                        options={brands.map((b) => ({
                            value: b.name,
                            label: b.name,
                        }))}
                        {...register('brand')}
                    />
                    <Select
                        label="Category"
                        error={errors.category?.message}
                        options={categories.map((c) => ({
                            value: c.name,
                            label: c.name,
                        }))}
                        {...register('category')}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label={`Selling price (Rs. per ${unit})`}
                        type="number"
                        step="0.01"
                        error={errors.price?.message}
                        {...register('price')}
                    />
                    <Input
                        label={`Display price (per ${unit}, optional)`}
                        type="number"
                        step="0.01"
                        error={errors.displayPrice?.message}
                        {...register('displayPrice')}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Sold by"
                        error={errors.unit?.message}
                        options={units.map((u) => ({
                            value: u.name,
                            label: u.measured ? `${u.name} · measured` : u.name,
                        }))}
                        {...register('unit')}
                    />
                    <Input
                        label={`Stock (${unit})`}
                        type="number"
                        step={qtyStep(decimals)}
                        min={0}
                        error={errors.stock?.message}
                        {...register('stock')}
                    />
                </div>
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
