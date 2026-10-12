import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { Card } from '@admin/shared/components/Card';
import { CompactButton } from '@admin/shared/components/controls';
import {
    DetailPanel,
    PanelFacts,
    PanelFigures,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { useToast } from '@admin/shared/components/Toast';
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { formatCurrency } from '@admin/shared/utils/currency';
import { unitCount } from '@admin/shared/utils/format';
import { useProduct } from '@admin/features/products/hooks';
import {
    getStockStatus,
    useDeleteProduct,
    useStockThresholds,
} from '@admin/features/inventory/hooks';
import { StockAdjust } from '@admin/features/inventory/components/StockAdjust';
import { PriceEdit } from '@admin/features/inventory/components/PriceEdit';
import { useCan } from '@admin/features/auth/hooks';
import type { Product } from '@admin/features/products/types';

export function ProductPanel({
    id,
    onClose,
    onEdit,
    onDeleted,
}: {
    id: string;
    onClose: () => void;
    onEdit: (p: Product) => void;
    onDeleted: () => void;
}) {
    const { data: p, isLoading, isError } = useProduct(id);
    const remove = useDeleteProduct();
    const t = useStockThresholds();
    const canStock = useCan('stock.adjust');
    const canPrice = useCan('prices.edit');
    const canDelete = useCan('records.delete');
    const confirm = useConfirm();
    const toast = useToast();

    if (isError) {
        return (
            <Card className="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-ink-muted">
                This product couldn't be found. It may have been deleted.
            </Card>
        );
    }
    if (isLoading || !p)
        return <Card className="flex-1 animate-pulse" aria-busy="true" />;

    const status = getStockStatus(p.stock, t);

    const handleDelete = async () => {
        const ok = await confirm({
            title: `Delete ${p.name}?`,
            description:
                'It disappears from the cashier screen. Past bills keep their line items. This cannot be undone.',
            confirmLabel: 'Delete product',
            danger: true,
        });
        if (!ok) return;
        try {
            await remove.mutateAsync(p.id);
            toast.success(`${p.name} deleted`);
            onDeleted();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not delete the product',
            );
        }
    };

    return (
        <DetailPanel
            title={p.name}
            meta={[p.brand, p.category].filter(Boolean).join(' · ')}
            badge={
                status.tone !== 'success' ? (
                    <Badge
                        tone={status.tone}
                        className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                    >
                        {status.label}
                    </Badge>
                ) : null
            }
            onClose={onClose}
            actions={
                <CompactButton onClick={() => onEdit(p)}>
                    <Pencil /> Edit details
                </CompactButton>
            }
        >
            <PanelFigures
                items={[
                    {
                        label: 'In stock',
                        value: unitCount(p.stock, p.unit, p.measured),
                        tone:
                            status.tone === 'danger'
                                ? 'danger'
                                : status.tone === 'warning'
                                  ? 'warning'
                                  : undefined,
                    },
                    { label: 'Price', value: formatCurrency(p.price) },
                    {
                        label: 'Sold this week',
                        value: p.unitsSoldWeek.toLocaleString('en-US'),
                    },
                ]}
            />

            {canStock && (
                <PanelSection
                    title="Receive stock"
                    aside={
                        p.stock <= t.low
                            ? `Low at ${t.low} or fewer`
                            : undefined
                    }
                >
                    <StockAdjust key={p.id} product={p} />
                </PanelSection>
            )}

            {canPrice ? (
                <PanelSection title="Price">
                    <PriceEdit
                        key={`${p.id}-${p.price}-${p.displayPrice}`}
                        product={p}
                    />
                </PanelSection>
            ) : (
                <PanelSection title="Price">
                    <PanelFacts
                        rows={[
                            {
                                label: 'Selling price',
                                value: formatCurrency(p.price),
                            },
                            {
                                label: 'Marked price',
                                value:
                                    p.displayPrice > p.price
                                        ? formatCurrency(p.displayPrice)
                                        : 'None',
                            },
                        ]}
                    />
                </PanelSection>
            )}

            <PanelSection title="Details">
                <PanelFacts
                    rows={[
                        { label: 'Brand', value: p.brand || '—' },
                        {
                            label: 'Category',
                            value: `${p.category} (${p.group})`,
                        },
                        { label: 'Sold by', value: p.unit },
                        {
                            label: 'Units sold, all time',
                            value: p.unitsSoldMonth.toLocaleString('en-US'),
                        },
                    ]}
                />
            </PanelSection>

            {canDelete && (
                <PanelSection>
                    <CompactButton
                        variant="danger"
                        onClick={handleDelete}
                        busy={remove.isPending}
                    >
                        <Trash2 /> Delete product
                    </CompactButton>
                </PanelSection>
            )}
        </DetailPanel>
    );
}
