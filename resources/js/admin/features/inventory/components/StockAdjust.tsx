import { useState } from 'react';
import { CompactButton, CompactInput } from '@admin/shared/components/controls';
import { useToast } from '@admin/shared/components/Toast';
import { unitCount } from '@admin/shared/utils/format';
import { qtyFits, roundQty } from '@admin/shared/utils/units';
import { cleanQty } from '@admin/shared/components/QtyInput';
import { useReceiveStock } from '@admin/features/inventory/hooks';
import type { Product } from '@admin/features/products/types';

/** Adds a delivery to stock, in the product's unit (decimals for m, ft, kg). (An exact count can still be set in "Edit details".) */
export function StockAdjust({ product }: { product: Product }) {
    const [qty, setQty] = useState('');
    const update = useReceiveStock();
    const toast = useToast();

    const n = Number(qty);
    const valid = qty.trim() !== '' && n > 0 && qtyFits(n, product.qtyDecimals);
    const next = roundQty(product.stock + (valid ? n : 0), product.qtyDecimals);
    const decimals = product.qtyDecimals;

    const save = async () => {
        if (!valid) return;
        try {
            await update.mutateAsync({ id: product.id, qty: n });
            toast.success(
                `Added ${unitCount(n, product.unit, product.measured)}`,
            );
            setQty('');
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not update stock',
            );
        }
    };

    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
                e.preventDefault();
                void save();
            }}
        >
            <div className="flex items-center gap-2">
                <CompactInput
                    inputMode={decimals > 0 ? 'decimal' : 'numeric'}
                    aria-label="Quantity received"
                    placeholder={`Qty received (${product.unit})`}
                    value={qty}
                    onChange={(e) => setQty(cleanQty(e.target.value, decimals))}
                    className="w-32"
                />
                <CompactButton
                    type="submit"
                    variant="primary"
                    disabled={!valid}
                    busy={update.isPending}
                >
                    Add to stock
                </CompactButton>
            </div>
            <p className="text-xs text-ink-muted tabular-nums">
                {valid
                    ? `${unitCount(product.stock, product.unit, product.measured)} → ${unitCount(next, product.unit, product.measured)}`
                    : 'Adds a delivery to the current count.'}
            </p>
        </form>
    );
}
