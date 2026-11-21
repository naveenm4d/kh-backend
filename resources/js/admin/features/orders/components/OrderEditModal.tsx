import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, X, Save } from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';
import { Dialog } from '@admin/shared/components/Dialog';
import { Button } from '@admin/shared/components/Button';
import { SearchBar } from '@admin/shared/components/SearchBar';
import { useToast } from '@admin/shared/components/Toast';
import { QtyInput } from '@admin/shared/components/QtyInput';
import { formatCurrency } from '@admin/shared/utils/currency';
import { unitCount } from '@admin/shared/utils/format';
import { roundQty } from '@admin/shared/utils/units';
import { useProducts } from '@admin/features/products/hooks';
import { useUpdateOrderItems } from '@admin/features/orders/hooks';
import type { Order } from '@admin/features/orders/types';
import {
    autoDiscountPct,
    formatPct,
    listPrice,
} from '@admin/features/products/pricing';
import type { Product } from '@admin/features/products/types';

interface EditLine {
    productId: string;
    name: string;
    unitPrice: number;
    qty: number;
    unit: string;
    measured: boolean;
    discountPct: number;
    source?: 'STORE' | 'WAREHOUSE';
}

function lineTotal(line: EditLine) {
    const raw = line.unitPrice * line.qty;
    return raw - (raw * line.discountPct) / 100;
}

export function OrderEditModal({
    order,
    onClose,
}: {
    order: Order | null;
    onClose: () => void;
}) {
    const toast = useToast();
    const updateItems = useUpdateOrderItems();
    const { data: catalog } = useProducts({ pageSize: 500 });
    const products = useMemo(() => catalog?.items ?? [], [catalog]);

    const [lines, setLines] = useState<EditLine[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (order) {
            setLines(
                // Keep each line's discount exactly as rung up (a manual 7.35% stays 7.35%):
                // re-deriving it from the rounded totals would change untouched lines on save.
                order.items.map((i) => ({
                    productId: i.productId,
                    name: i.name,
                    unitPrice: i.unitPrice,
                    qty: i.qty,
                    unit: i.unit,
                    measured: i.measured,
                    discountPct: i.discountPct,
                    source: i.source,
                })),
            );
            setSearch('');
        }
    }, [order]);

    // Original quantities were already deducted from stock, so they're still
    // "available" for this order to reclaim when raising a line's quantity.
    const originalQtyByProduct = useMemo(() => {
        const map = new Map<string, number>();
        order?.items.forEach((i) =>
            map.set(i.productId, (map.get(i.productId) ?? 0) + i.qty),
        );
        return map;
    }, [order]);

    const maxQtyFor = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return Infinity;
        return product.stock + (originalQtyByProduct.get(productId) ?? 0);
    };

    /** Decimals the product's unit allows now (the server checks against it), else a safe guess. */
    const decimalsFor = (line: EditLine) =>
        products.find((p) => p.id === line.productId)?.qtyDecimals ??
        (line.measured ? 3 : 0);

    const total = lines.reduce((sum, l) => sum + lineTotal(l), 0);

    const searchResults = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];
        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.id.toLowerCase().includes(q),
            )
            .slice(0, 8);
    }, [products, search]);

    const addProduct = (product: Product) => {
        setLines((prev) => {
            const existing = prev.find((l) => l.productId === product.id);
            if (existing) {
                const max = maxQtyFor(product.id);
                return prev.map((l) =>
                    l.productId === product.id
                        ? { ...l, qty: Math.min(l.qty + 1, max) }
                        : l,
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    unitPrice: listPrice(product),
                    qty: Math.min(1, product.stock),
                    unit: product.unit,
                    measured: product.measured,
                    discountPct: autoDiscountPct(product),
                    source: 'WAREHOUSE',
                },
            ];
        });
        setSearch('');
    };

    const incQty = (productId: string) => {
        const max = maxQtyFor(productId);
        setLines((prev) =>
            prev.map((l) =>
                l.productId === productId
                    ? { ...l, qty: roundQty(Math.min(l.qty + 1, max), 3) }
                    : l,
            ),
        );
    };

    const decQty = (productId: string) => {
        setLines((prev) =>
            prev.flatMap((l) => {
                if (l.productId !== productId) return [l];
                const qty = roundQty(l.qty - 1, 3);
                return qty > 0 ? [{ ...l, qty }] : [];
            }),
        );
    };

    /** A typed quantity (2.5 kg), kept within what's in stock; 0 leaves the line for − or × to remove. */
    const setQty = (productId: string, qty: number) => {
        const max = maxQtyFor(productId);
        setLines((prev) =>
            prev.map((l) =>
                l.productId === productId
                    ? {
                          ...l,
                          qty: roundQty(Math.min(qty, max), decimalsFor(l)),
                      }
                    : l,
            ),
        );
    };

    const removeLine = (productId: string) => {
        setLines((prev) => prev.filter((l) => l.productId !== productId));
    };

    const setSource = (productId: string, source: 'STORE' | 'WAREHOUSE') => {
        setLines((prev) =>
            prev.map((l) => (l.productId === productId ? { ...l, source } : l)),
        );
    };

    const setDiscount = (productId: string, pct: number) => {
        const clamped = Math.min(100, Math.max(0, pct));
        setLines((prev) =>
            prev.map((l) =>
                l.productId === productId ? { ...l, discountPct: clamped } : l,
            ),
        );
    };

    const handleSave = async () => {
        if (!order) return;
        if (lines.length === 0) {
            toast.error('An order must contain at least one item');
            return;
        }
        const empty = lines.find((l) => l.qty <= 0);
        if (empty) {
            toast.error(`Enter a quantity for ${empty.name}`);
            return;
        }
        try {
            await updateItems.mutateAsync({
                invoice: order.invoice,
                items: lines.map((l) => ({
                    productId: l.productId,
                    name: l.name,
                    qty: l.qty,
                    unitPrice: l.unitPrice,
                    discountPct: l.discountPct,
                    source: l.source,
                })),
            });
            toast.success('Order items updated');
            onClose();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Failed to update order items',
            );
        }
    };

    return (
        <Dialog
            open={!!order}
            onClose={onClose}
            title={order ? `Edit ${order.invoice}` : ''}
            className="max-w-lg"
            footer={
                order && (
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            className="flex-1"
                            isLoading={updateItems.isPending}
                            onClick={handleSave}
                        >
                            <Save className="size-4" /> Save changes
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Discard
                        </Button>
                    </div>
                )
            }
        >
            {order && (
                <div className="flex flex-col gap-3">
                    {lines.length > 0 ? (
                        <div className="flex flex-col rounded-xl border border-line bg-white px-3">
                            {lines.map((line) => (
                                <EditLineItem
                                    key={line.productId}
                                    line={line}
                                    max={maxQtyFor(line.productId)}
                                    decimals={decimalsFor(line)}
                                    onInc={() => incQty(line.productId)}
                                    onDec={() => decQty(line.productId)}
                                    onQty={(qty) => setQty(line.productId, qty)}
                                    onDiscount={(pct) =>
                                        setDiscount(line.productId, pct)
                                    }
                                    onSource={(source) =>
                                        setSource(line.productId, source)
                                    }
                                    onRemove={() => removeLine(line.productId)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-sm text-ink-muted">
                            No items — add at least one below.
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <SearchBar
                            placeholder="Search products to add…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search.trim() && (
                            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-xl border border-line p-1.5">
                                {searchResults.length === 0 && (
                                    <div className="py-2 text-center text-xs text-ink-muted">
                                        No products found
                                    </div>
                                )}
                                {searchResults.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => addProduct(p)}
                                        className="flex cursor-pointer items-center justify-between gap-2 rounded-lg p-2 text-left hover:bg-canvas"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-xs font-bold">
                                                {p.name}
                                            </div>
                                            <div className="text-[11px] text-ink-muted">
                                                {formatCurrency(p.price)} ·{' '}
                                                {unitCount(
                                                    p.stock,
                                                    p.unit,
                                                    p.measured,
                                                )}{' '}
                                                in stock
                                            </div>
                                        </div>
                                        <Plus className="size-3.5 shrink-0 text-brand-600" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="my-1 h-px bg-line" />
                    <div className="flex items-center justify-between">
                        <span className="font-bold">Total</span>
                        <span className="text-lg font-extrabold">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>
            )}
        </Dialog>
    );
}

const stepBtn =
    'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-transform active:scale-90 active:bg-line disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';

/** One bill line, laid out like the till's cart line (features/pos/components/CartLineItem in the desktop app). */
function EditLineItem({
    line,
    max,
    decimals,
    onInc,
    onDec,
    onQty,
    onDiscount,
    onSource,
    onRemove,
}: {
    line: EditLine;
    max: number;
    decimals: number;
    onInc: () => void;
    onDec: () => void;
    onQty: (qty: number) => void;
    onDiscount: (pct: number) => void;
    onSource: (source: 'STORE' | 'WAREHOUSE') => void;
    onRemove: () => void;
}) {
    // Set when a typed quantity was more than the stock, so the admin sees why it was lowered.
    const [overStock, setOverStock] = useState(false);
    const atMax = line.qty >= max;
    const fullTotal = line.unitPrice * line.qty;
    const total = lineTotal(line);
    const saved = fullTotal - total;
    const perUnit = line.measured ? `/ ${line.unit}` : 'each';

    return (
        <div className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm leading-snug font-bold">
                        {line.name}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-muted tabular-nums">
                        {formatCurrency(line.unitPrice)} {perUnit}
                        {line.discountPct > 0 && (
                            <span className="font-semibold text-success-text">
                                {' '}
                                · −{formatPct(line.discountPct)}%
                            </span>
                        )}
                    </div>
                    {saved > 0.004 && (
                        <div className="mt-0.5 text-xs font-semibold text-success-text tabular-nums">
                            Saves {formatCurrency(saved)}
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 flex-col items-end pt-px tabular-nums">
                    <div className="text-sm font-extrabold">
                        {formatCurrency(total)}
                    </div>
                    {saved > 0.004 && (
                        <div className="text-xs text-ink-subtle line-through">
                            {formatCurrency(fullTotal)}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${line.name}`}
                    className="-mt-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-danger-bg hover:text-danger-text"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Quantity, discount and stock source share one row to keep each line short. */}
            <div className="grid grid-cols-3 gap-1.5">
                <div className="flex h-11 min-w-0 items-center rounded-xl bg-canvas p-1">
                    <button
                        type="button"
                        onClick={() => {
                            setOverStock(false);
                            onDec();
                        }}
                        aria-label="Decrease quantity"
                        className={stepBtn}
                    >
                        <Minus className="size-4" />
                    </button>
                    <QtyInput
                        aria-label={`Quantity of ${line.name} (${line.unit})`}
                        value={line.qty}
                        decimals={decimals}
                        onChange={(qty) => {
                            setOverStock(qty > max);
                            onQty(qty);
                        }}
                        className="h-full w-full min-w-0 flex-1 rounded-md border-0 bg-transparent text-base font-extrabold focus:bg-white"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setOverStock(false);
                            onInc();
                        }}
                        disabled={atMax}
                        title={atMax ? 'No more stock available' : undefined}
                        aria-label="Increase quantity"
                        className={stepBtn}
                    >
                        <Plus className="size-4" />
                    </button>
                </div>

                <label
                    title="Discount"
                    className="flex h-11 min-w-0 items-center gap-1 rounded-xl bg-canvas px-2.5 focus-within:ring-2 focus-within:ring-brand-400"
                >
                    <span className="shrink-0 text-xs font-semibold text-ink-muted">
                        Disc.
                    </span>
                    <input
                        inputMode="decimal"
                        value={
                            line.discountPct ? formatPct(line.discountPct) : ''
                        }
                        placeholder="0"
                        onChange={(e) =>
                            onDiscount(parseFloat(e.target.value) || 0)
                        }
                        aria-label={`Discount percent for ${line.name}`}
                        className="w-full min-w-0 flex-1 bg-transparent text-right text-sm font-bold tabular-nums outline-none placeholder:text-ink-subtle"
                    />
                    <span className="shrink-0 text-sm font-bold text-ink-muted">
                        %
                    </span>
                </label>

                {/* Click to switch where the stock comes from. */}
                <button
                    type="button"
                    onClick={() =>
                        onSource(
                            line.source === 'STORE' ? 'WAREHOUSE' : 'STORE',
                        )
                    }
                    aria-label={`Stock from ${line.source === 'STORE' ? 'store' : 'warehouse'}. Click to switch.`}
                    className={cn(
                        'h-11 min-w-0 cursor-pointer truncate rounded-xl px-1 text-[13px] font-bold transition-colors active:scale-[0.97]',
                        line.source === 'STORE'
                            ? 'bg-success-text text-white'
                            : 'bg-yellow-400 text-ink',
                    )}
                >
                    {line.source === 'STORE' ? 'Store' : 'Warehouse'}
                </button>
            </div>
            {overStock && (
                <div
                    role="status"
                    className="text-xs font-semibold text-warning-text tabular-nums"
                >
                    Only {unitCount(max, line.unit, line.measured)} available,
                    so the quantity was set to that.
                </div>
            )}
        </div>
    );
}
