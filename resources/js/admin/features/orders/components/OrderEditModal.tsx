import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, X, Save } from 'lucide-react';
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
import { autoDiscountPct, listPrice } from '@admin/features/products/pricing';
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
                order.items.map((i) => {
                    const raw = i.unitPrice * i.qty;
                    const discountPct =
                        raw > 0 ? Math.round((1 - i.total / raw) * 100) : 0;
                    return {
                        productId: i.productId,
                        name: i.name,
                        unitPrice: i.unitPrice,
                        qty: i.qty,
                        unit: i.unit,
                        measured: i.measured,
                        discountPct,
                        source: i.source,
                    };
                }),
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
                    <div className="flex flex-col gap-2">
                        {lines.map((line) => {
                            const atMax = line.qty >= maxQtyFor(line.productId);
                            return (
                                <div
                                    key={line.productId}
                                    className="flex flex-col gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[13px] font-bold">
                                                {line.name}
                                            </div>
                                            <div className="text-xs text-ink-muted">
                                                {formatCurrency(line.unitPrice)}{' '}
                                                {line.measured
                                                    ? `/ ${line.unit}`
                                                    : 'ea'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() =>
                                                    decQty(line.productId)
                                                }
                                                className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-canvas active:scale-90"
                                            >
                                                <Minus className="size-3.5" />
                                            </button>
                                            <QtyInput
                                                aria-label={`Quantity of ${line.name} (${line.unit})`}
                                                value={line.qty}
                                                decimals={decimalsFor(line)}
                                                onChange={(qty) =>
                                                    setQty(line.productId, qty)
                                                }
                                            />
                                            <button
                                                onClick={() =>
                                                    incQty(line.productId)
                                                }
                                                disabled={atMax}
                                                title={
                                                    atMax
                                                        ? 'No more stock available'
                                                        : undefined
                                                }
                                                className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-canvas active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Plus className="size-3.5" />
                                            </button>
                                        </div>
                                        <div className="w-20 shrink-0 text-right text-sm font-extrabold">
                                            {formatCurrency(lineTotal(line))}
                                        </div>
                                        <button
                                            onClick={() =>
                                                removeLine(line.productId)
                                            }
                                            className="cursor-pointer text-ink-muted hover:text-danger-text"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-ink-muted">
                                            Discount
                                        </span>
                                        <input
                                            value={line.discountPct}
                                            onChange={(e) =>
                                                setDiscount(
                                                    line.productId,
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                                )
                                            }
                                            className="h-6.5 w-12 rounded-md border border-line text-center text-xs font-bold outline-none"
                                        />
                                        <span className="text-xs text-ink-muted">
                                            %
                                        </span>
                                    </div>
                                    <div className="flex overflow-hidden rounded-lg border border-line text-xs font-bold">
                                        <button
                                            onClick={() =>
                                                setSource(
                                                    line.productId,
                                                    'STORE',
                                                )
                                            }
                                            className={`flex-1 cursor-pointer py-1.5 transition-colors ${line.source === 'STORE' ? 'bg-success-text text-white' : 'bg-canvas text-ink-muted hover:bg-line'}`}
                                        >
                                            Store
                                        </button>
                                        <div className="w-px bg-line" />
                                        <button
                                            onClick={() =>
                                                setSource(
                                                    line.productId,
                                                    'WAREHOUSE',
                                                )
                                            }
                                            className={`flex-1 cursor-pointer py-1.5 transition-colors ${line.source === 'WAREHOUSE' ? 'bg-yellow-400 text-ink' : 'bg-canvas text-ink-muted hover:bg-line'}`}
                                        >
                                            Warehouse
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {lines.length === 0 && (
                            <div className="py-4 text-center text-sm text-ink-muted">
                                No items — add at least one below.
                            </div>
                        )}
                    </div>

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
