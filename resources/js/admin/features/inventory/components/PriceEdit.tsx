import { useState } from 'react';
import { CompactButton, CompactInput } from '@admin/shared/components/controls';
import { useToast } from '@admin/shared/components/Toast';
import {
    formatCurrency,
    parseCurrencyInput,
} from '@admin/shared/utils/currency';
import { useUpdateProduct } from '@admin/features/inventory/hooks';
import type { Product } from '@admin/features/products/types';

/**
 * Quick price change without the full product form. Marked price is optional: when set above the
 * selling price, the cashier adds the item at the marked price with an automatic discount down to it.
 */
export function PriceEdit({ product }: { product: Product }) {
    const [price, setPrice] = useState(String(product.price));
    const [marked, setMarked] = useState(
        product.displayPrice > 0 ? String(product.displayPrice) : '',
    );
    const update = useUpdateProduct();
    const toast = useToast();

    const p = parseCurrencyInput(price);
    const m = marked.trim() === '' ? 0 : parseCurrencyInput(marked);
    const error =
        p <= 0
            ? 'Selling price must be more than zero'
            : m > 0 && m < p
              ? 'Marked price can’t be below the selling price'
              : null;
    const changed = p !== product.price || m !== (product.displayPrice || 0);

    const save = async () => {
        if (error || !changed) return;
        try {
            await update.mutateAsync({
                id: product.id,
                input: {
                    name: product.name,
                    brand: product.brand,
                    category: product.category,
                    unit: product.unit,
                    price: p,
                    displayPrice: m,
                    stock: product.stock,
                },
            });
            toast.success(`Price updated to ${formatCurrency(p)}`);
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not update the price',
            );
        }
    };

    return (
        <form
            className="flex flex-col gap-2.5"
            onSubmit={(e) => {
                e.preventDefault();
                void save();
            }}
        >
            <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-ink-muted">
                        Selling price (Rs.)
                    </span>
                    <CompactInput
                        inputMode="numeric"
                        value={price}
                        invalid={!!error && p <= 0}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-ink-muted">
                        Marked price (optional)
                    </span>
                    <CompactInput
                        inputMode="numeric"
                        value={marked}
                        placeholder="None"
                        invalid={!!error && p > 0}
                        onChange={(e) => setMarked(e.target.value)}
                    />
                </label>
            </div>
            <div className="flex items-center gap-3">
                <CompactButton
                    type="submit"
                    variant="primary"
                    disabled={!changed || !!error}
                    busy={update.isPending}
                >
                    Save price
                </CompactButton>
                <span
                    className={
                        error
                            ? 'text-xs text-danger-text'
                            : 'text-xs text-ink-muted tabular-nums'
                    }
                >
                    {error ??
                        (m > p
                            ? `Cashier shows ${Math.round((1 - p / m) * 100)}% off ${formatCurrency(m)}`
                            : changed
                              ? 'Not saved yet'
                              : 'No marked price')}
                </span>
            </div>
        </form>
    );
}
