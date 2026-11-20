import { useMemo, useState } from 'react';
import { Boxes, Plus } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import {
    CompactButton,
    MiniSelect,
    SearchField,
    Segmented,
} from '@admin/shared/components/controls';
import { RecordsLayout } from '@admin/shared/components/records/RecordsLayout';
import { RecordList } from '@admin/shared/components/records/RecordList';
import type { RecordColumn } from '@admin/shared/components/records/RecordList';
import { NoSelection } from '@admin/shared/components/records/DetailPanel';
import { useSelectedId } from '@admin/shared/components/records/useSelectedId';
import { PanelEmpty } from '@admin/shared/components/Panel';
import { useDebounce } from '@admin/shared/hooks/useDebounce';
import { useDisclosure } from '@admin/shared/hooks/useDisclosure';
import { formatCurrency } from '@admin/shared/utils/currency';
import { unitCount } from '@admin/shared/utils/format';
import {
    useCategories,
    useInventoryProducts,
    getStockStatus,
    stockChipLabel,
    useStockThresholds,
} from '@admin/features/inventory/hooks';
import type { StockThresholds } from '@admin/features/inventory/hooks';
import { ProductFormModal } from '@admin/features/inventory/components/ProductFormModal';
import { ProductPanel } from '@admin/features/inventory/components/ProductPanel';
import { useCan } from '@admin/features/auth/hooks';
import type { Product } from '@admin/features/products/types';
import { formatQty } from '@admin/shared/utils/units';

type StockFilter = 'all' | 'low' | 'out';

const columnsFor = (t: StockThresholds): RecordColumn<Product>[] => [
    {
        key: 'name',
        header: 'Product',
        className: 'max-w-[300px]',
        render: (p) => (
            <span className="flex min-w-0 items-baseline gap-2">
                <span className="truncate font-medium text-ink">{p.name}</span>
            </span>
        ),
    },
    {
        key: 'category',
        header: 'Category',
        optional: true,
        render: (p) => <span className="text-ink-muted">{p.category}</span>,
    },
    {
        key: 'price',
        header: 'Price',
        align: 'right',
        render: (p) => (
            <span className="tabular-nums">{formatCurrency(p.price)}</span>
        ),
    },
    {
        key: 'week',
        header: 'Sold this week',
        align: 'right',
        optional: true,
        render: (p) => (
            <span className="text-ink-muted tabular-nums">
                {p.unitsSoldWeek || '—'}
            </span>
        ),
    },
    {
        key: 'stock',
        header: 'In stock',
        align: 'right',
        render: (p) => {
            const s = getStockStatus(p.stock, t);
            return s.tone === 'success' ? (
                <span className="tabular-nums">
                    {formatQty(p.stock)}
                    {p.measured && (
                        <span className="text-ink-muted"> {p.unit}</span>
                    )}
                </span>
            ) : (
                <Badge
                    tone={s.tone}
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                >
                    {stockChipLabel(p.stock, p.unit, unitCount, p.measured)}
                </Badge>
            );
        },
    },
];

export function InventoryPage() {
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('All');
    const [stock, setStock] = useState<StockFilter>('all');
    const debounced = useDebounce(search);
    const { data, isLoading } = useInventoryProducts({
        search: debounced,
        group,
        pageSize: 500,
    });
    const { data: all } = useInventoryProducts({ pageSize: 500 });
    const { data: categories = [] } = useCategories();
    const [selected, select] = useSelectedId();
    const t = useStockThresholds();
    const COLUMNS = useMemo(() => columnsFor(t), [t.low, t.critical]);
    const form = useDisclosure();
    const canCreate = useCan('prices.edit');
    const [editing, setEditing] = useState<Product | null>(null);

    const groups = useMemo(
        () => ['All', ...Array.from(new Set(categories.map((c) => c.group)))],
        [categories],
    );
    const products = data?.items ?? [];
    const rows = useMemo(() => {
        if (stock === 'all') return products;
        // Restocking views: fewest first, so the most urgent sits at the top.
        return products
            .filter((p) => (stock === 'out' ? p.stock === 0 : p.stock <= t.low))
            .sort((a, b) => a.stock - b.stock);
    }, [products, stock]);

    const everything = all?.items ?? [];
    const lowCount = everything.filter((p) => p.stock <= t.low).length;
    const outCount = everything.filter((p) => p.stock === 0).length;
    const filtersOn = !!search || group !== 'All' || stock !== 'all';

    return (
        <>
            <RecordsLayout
                title="Inventory"
                subtitle={
                    all
                        ? `${everything.length} products · ${lowCount} at or below ${t.low} · ${outCount} out of stock`
                        : '…'
                }
                actions={
                    canCreate && (
                        <CompactButton
                            variant="primary"
                            onClick={() => {
                                setEditing(null);
                                form.open();
                            }}
                        >
                            <Plus /> New product
                        </CompactButton>
                    )
                }
                toolbar={
                    <>
                        <SearchField
                            value={search}
                            onChange={setSearch}
                            placeholder="Search product or brand"
                            className="w-64"
                        />
                        <Segmented
                            label="Stock"
                            value={stock}
                            onChange={setStock}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'low', label: `Low (${lowCount})` },
                                { value: 'out', label: `Out (${outCount})` },
                            ]}
                        />
                        <MiniSelect
                            aria-label="Product group"
                            value={group}
                            onChange={setGroup}
                            options={groups.map((g) => ({
                                value: g,
                                label: g === 'All' ? 'All groups' : g,
                            }))}
                            className="w-40"
                        />
                    </>
                }
                list={
                    <RecordList
                        label="Products"
                        columns={COLUMNS}
                        rows={rows}
                        rowKey={(p) => p.id}
                        selected={selected}
                        onSelect={select}
                        isLoading={isLoading}
                        empty={
                            <PanelEmpty
                                icon={<Boxes className="size-6" />}
                                title={
                                    stock === 'out' && !search
                                        ? 'Nothing is out of stock'
                                        : stock === 'low' && !search
                                          ? `Nothing is at or below ${t.low}`
                                          : filtersOn
                                            ? 'No products match'
                                            : 'No products yet'
                                }
                                description={
                                    filtersOn
                                        ? 'Try another search, group or stock filter.'
                                        : undefined
                                }
                            />
                        }
                    />
                }
                panel={
                    selected ? (
                        <ProductPanel
                            key={selected}
                            id={selected}
                            onClose={() => select(null)}
                            onEdit={(p) => {
                                setEditing(p);
                                form.open();
                            }}
                            onDeleted={() => select(null)}
                        />
                    ) : (
                        <NoSelection noun="a product" />
                    )
                }
            />
            <ProductFormModal
                open={form.isOpen}
                onClose={form.close}
                product={editing}
            />
        </>
    );
}
