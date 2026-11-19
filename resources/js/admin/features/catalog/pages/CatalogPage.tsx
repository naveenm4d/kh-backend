import { useMemo, useState } from 'react';
import { Link, useSearchParams } from '@admin/shared/lib/router';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { Card } from '@admin/shared/components/Card';
import {
    CompactButton,
    SearchField,
    Segmented,
} from '@admin/shared/components/controls';
import { RecordsLayout } from '@admin/shared/components/records/RecordsLayout';
import { RecordList } from '@admin/shared/components/records/RecordList';
import type { RecordColumn } from '@admin/shared/components/records/RecordList';
import {
    DetailPanel,
    NoSelection,
    PanelFacts,
    PanelFigures,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { useSelectedId } from '@admin/shared/components/records/useSelectedId';
import { PanelEmpty } from '@admin/shared/components/Panel';
import { useToast } from '@admin/shared/components/Toast';
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { useDisclosure } from '@admin/shared/hooks/useDisclosure';
import {
    getStockStatus,
    stockChipLabel,
    useInventoryProducts,
    useStockThresholds,
} from '@admin/features/inventory/hooks';
import { unitCount } from '@admin/shared/utils/format';
import { useCan } from '@admin/features/auth/hooks';
import { useBrands, useDeleteBrand } from '@admin/features/products/hooks';
import { BrandFormModal } from '@admin/features/products/components/BrandFormModal';
import {
    useCategories,
    useDeleteCategory,
} from '@admin/features/categories/hooks';
import { CategoryFormModal } from '@admin/features/categories/components/CategoryFormModal';
import {
    useDeleteSupplier,
    useSuppliers,
} from '@admin/features/suppliers/hooks';
import { SupplierFormModal } from '@admin/features/suppliers/components/SupplierFormModal';
import { useDeleteUnit, useUnits } from '@admin/features/units/hooks';
import { UnitFormModal } from '@admin/features/units/components/UnitFormModal';
import type { Brand, Product } from '@admin/features/products/types';
import type { Category } from '@admin/features/categories/types';
import type { Supplier } from '@admin/features/suppliers/types';
import type { Unit } from '@admin/features/units/types';

type Tab = 'brands' | 'categories' | 'units' | 'suppliers';

const NOUN: Record<Tab, { one: string; add: string }> = {
    brands: { one: 'a brand', add: 'New brand' },
    categories: { one: 'a category', add: 'New category' },
    units: { one: 'a unit', add: 'New unit' },
    suppliers: { one: 'a supplier', add: 'New supplier' },
};

function useRemove<T>(
    mutate: (id: string) => Promise<unknown>,
    label: (t: T) => string,
    onDone: () => void,
) {
    const confirm = useConfirm();
    const toast = useToast();
    return async (item: T, id: string, description: string) => {
        const ok = await confirm({
            title: `Delete ${label(item)}?`,
            description,
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        try {
            await mutate(id);
            toast.success(`${label(item)} deleted`);
            onDone();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    `Could not delete ${label(item)}`,
            );
        }
    };
}

/** The products using a brand or category, as a short linked list into Inventory. */
function ProductsUsing({ products }: { products: Product[] }) {
    const t = useStockThresholds();
    if (products.length === 0)
        return (
            <div className="text-[13px] text-ink-muted">
                No products use this yet.
            </div>
        );
    return (
        <ul className="-mx-2">
            {products.map((p) => {
                const s = getStockStatus(p.stock, t);
                return (
                    <li key={p.id}>
                        <Link
                            to={`/admin/inventory?id=${p.id}`}
                            className="flex items-center gap-3 rounded-md px-2 py-1.5 text-[13px] hover:bg-canvas/70"
                        >
                            <span className="min-w-0 flex-1 truncate text-ink">
                                {p.name}
                            </span>
                            {s.tone === 'success' ? (
                                <span className="text-ink-muted tabular-nums">
                                    {unitCount(p.stock, p.unit, p.measured)}
                                </span>
                            ) : (
                                <Badge
                                    tone={s.tone}
                                    className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                                >
                                    {stockChipLabel(
                                        p.stock,
                                        p.unit,
                                        unitCount,
                                        p.measured,
                                    )}
                                </Badge>
                            )}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

/** "Count" or "Measure, to 0.01". */
function unitKind(u: Unit): string {
    if (!u.measured) return 'Count';
    return u.decimals === 0
        ? 'Measure, whole'
        : `Measure, to ${(10 ** -u.decimals).toFixed(u.decimals)}`;
}

function deleteNote(count: number, noun: string) {
    return count > 0
        ? `${count} product${count === 1 ? '' : 's'} use this ${noun}. They keep the name, but you won't be able to pick it for new products. This cannot be undone.`
        : 'This cannot be undone.';
}

export function CatalogPage() {
    const [params, setParams] = useSearchParams();
    const tab =
        (['brands', 'categories', 'units', 'suppliers'] as const).find(
            (t) => t === params.get('tab'),
        ) ?? 'brands';
    const [search, setSearch] = useState('');
    const [selected, select] = useSelectedId();
    const canDelete = useCan('records.delete');
    const t = useStockThresholds();
    const form = useDisclosure();
    const [editing, setEditing] = useState<
        Brand | Category | Unit | Supplier | null
    >(null);

    const { data: brands = [], isLoading: loadingBrands } = useBrands();
    const { data: categories = [], isLoading: loadingCategories } =
        useCategories();
    const { data: suppliers = [], isLoading: loadingSuppliers } =
        useSuppliers();
    const { data: units = [], isLoading: loadingUnits } = useUnits();
    const { data: productsPage } = useInventoryProducts({ pageSize: 500 });
    const products = useMemo(() => productsPage?.items ?? [], [productsPage]);

    const setTab = (t: Tab) => {
        setSearch('');
        setParams({ tab: t }, { replace: true }); // also clears the selection
    };
    const openNew = () => {
        setEditing(null);
        form.open();
    };
    const openEdit = (item: Brand | Category | Unit | Supplier) => {
        setEditing(item);
        form.open();
    };
    const q = search.trim().toLowerCase();

    const removeBrand = useRemove<Brand>(
        useDeleteBrand().mutateAsync,
        (b) => b.name,
        () => select(null),
    );
    const removeCategory = useRemove<Category>(
        useDeleteCategory().mutateAsync,
        (c) => c.name,
        () => select(null),
    );
    const removeUnit = useRemove<Unit>(
        useDeleteUnit().mutateAsync,
        (u) => u.name,
        () => select(null),
    );
    const removeSupplier = useRemove<Supplier>(
        useDeleteSupplier().mutateAsync,
        (s) => s.name,
        () => select(null),
    );

    const byBrand = (name: string) => products.filter((p) => p.brand === name);
    const byCategory = (name: string) =>
        products.filter((p) => p.category === name);

    let list: React.ReactNode;
    let panel: React.ReactNode = null;
    const empty = (what: string) => (
        <PanelEmpty
            icon={<Layers className="size-6" />}
            title={q ? `No ${what} match "${search}"` : `No ${what} yet`}
            description={q ? undefined : `Add one with "${NOUN[tab].add}".`}
        />
    );

    if (tab === 'brands') {
        const rows = brands
            .filter((b) => b.name.toLowerCase().includes(q))
            .sort((a, b) => a.name.localeCompare(b.name));
        const columns: RecordColumn<Brand>[] = [
            {
                key: 'name',
                header: 'Brand',
                render: (b) => <span className="font-medium">{b.name}</span>,
            },
            {
                key: 'products',
                header: 'Products',
                align: 'right',
                render: (b) => (
                    <span className="text-ink-muted tabular-nums">
                        {byBrand(b.name).length}
                    </span>
                ),
            },
        ];
        list = (
            <RecordList
                label="Brands"
                columns={columns}
                rows={rows}
                rowKey={(b) => b.id}
                selected={selected}
                onSelect={select}
                isLoading={loadingBrands}
                empty={empty('brands')}
            />
        );
        const b = brands.find((x) => x.id === selected);
        if (b) {
            const used = byBrand(b.name);
            panel = (
                <DetailPanel
                    title={b.name}
                    meta="Brand"
                    onClose={() => select(null)}
                    actions={
                        <CompactButton onClick={() => openEdit(b)}>
                            <Pencil /> Rename
                        </CompactButton>
                    }
                >
                    <PanelFigures
                        items={[
                            { label: 'Products', value: used.length },
                            {
                                label: 'Low or out',
                                value: used.filter(
                                    (p) =>
                                        getStockStatus(p.stock, t).tone !==
                                        'success',
                                ).length,
                            },
                        ]}
                    />
                    <PanelSection title="Products">
                        <ProductsUsing products={used} />
                    </PanelSection>
                    {canDelete && (
                        <PanelSection>
                            <CompactButton
                                variant="danger"
                                onClick={() =>
                                    removeBrand(
                                        b,
                                        b.id,
                                        deleteNote(used.length, 'brand'),
                                    )
                                }
                            >
                                <Trash2 /> Delete brand
                            </CompactButton>
                        </PanelSection>
                    )}
                </DetailPanel>
            );
        }
    } else if (tab === 'categories') {
        const rows = categories.filter((c) =>
            [c.name, c.group, c.parent].some((v) =>
                v.toLowerCase().includes(q),
            ),
        );
        const columns: RecordColumn<Category>[] = [
            {
                key: 'name',
                header: 'Category',
                render: (c) => <span className="font-medium">{c.name}</span>,
            },
            // Parent only adds information where it differs from the group.
            {
                key: 'group',
                header: 'Group',
                render: (c) => (
                    <span className="text-ink-muted">
                        {c.parent && c.parent !== c.group
                            ? `${c.group} · in ${c.parent}`
                            : c.group}
                    </span>
                ),
            },
            {
                key: 'products',
                header: 'Products',
                align: 'right',
                render: (c) => (
                    <span className="text-ink-muted tabular-nums">
                        {byCategory(c.name).length}
                    </span>
                ),
            },
        ];
        list = (
            <RecordList
                label="Categories"
                columns={columns}
                rows={rows}
                rowKey={(c) => c.id}
                selected={selected}
                onSelect={select}
                isLoading={loadingCategories}
                empty={empty('categories')}
            />
        );
        const c = categories.find((x) => x.id === selected);
        if (c) {
            const used = byCategory(c.name);
            panel = (
                <DetailPanel
                    title={c.name}
                    meta={`${c.group} group${c.parent && c.parent !== c.group ? ` · in ${c.parent}` : ''}`}
                    onClose={() => select(null)}
                    actions={
                        <CompactButton onClick={() => openEdit(c)}>
                            <Pencil /> Edit
                        </CompactButton>
                    }
                >
                    <PanelFigures
                        items={[
                            { label: 'Products', value: used.length },
                            {
                                label: 'Low or out',
                                value: used.filter(
                                    (p) =>
                                        getStockStatus(p.stock, t).tone !==
                                        'success',
                                ).length,
                            },
                        ]}
                    />
                    <PanelSection title="Products">
                        <ProductsUsing products={used} />
                    </PanelSection>
                    {canDelete && (
                        <PanelSection>
                            <CompactButton
                                variant="danger"
                                onClick={() =>
                                    removeCategory(
                                        c,
                                        c.id,
                                        deleteNote(used.length, 'category'),
                                    )
                                }
                            >
                                <Trash2 /> Delete category
                            </CompactButton>
                        </PanelSection>
                    )}
                </DetailPanel>
            );
        }
    } else if (tab === 'units') {
        const rows = units.filter((u) => u.name.toLowerCase().includes(q));
        const columns: RecordColumn<Unit>[] = [
            {
                key: 'name',
                header: 'Unit',
                render: (u) => <span className="font-medium">{u.name}</span>,
            },
            {
                key: 'kind',
                header: 'Sold by',
                render: (u) => (
                    <span className="text-ink-muted">{unitKind(u)}</span>
                ),
            },
            {
                key: 'products',
                header: 'Products',
                align: 'right',
                render: (u) => (
                    <span className="text-ink-muted tabular-nums">
                        {u.productCount}
                    </span>
                ),
            },
        ];
        list = (
            <RecordList
                label="Units"
                columns={columns}
                rows={rows}
                rowKey={(u) => u.id}
                selected={selected}
                onSelect={select}
                isLoading={loadingUnits}
                empty={empty('units')}
            />
        );
        const u = units.find((x) => x.id === selected);
        if (u) {
            const used = products.filter((p) => p.unitId === u.id);
            panel = (
                <DetailPanel
                    title={u.name}
                    meta={`Unit · ${unitKind(u)}`}
                    onClose={() => select(null)}
                    actions={
                        <CompactButton onClick={() => openEdit(u)}>
                            <Pencil /> Edit
                        </CompactButton>
                    }
                >
                    <PanelSection>
                        <PanelFacts
                            rows={[
                                {
                                    label: 'Quantities',
                                    value:
                                        u.decimals === 0
                                            ? 'Whole numbers'
                                            : `Up to ${u.decimals} decimal place${u.decimals === 1 ? '' : 's'}`,
                                },
                                {
                                    label: 'On bills',
                                    value: u.measured
                                        ? `2.5 ${u.name} × Rs. 650`
                                        : '3 × Rs. 2,750',
                                },
                                { label: 'Products', value: u.productCount },
                            ]}
                        />
                    </PanelSection>
                    <PanelSection title="Products">
                        <ProductsUsing products={used} />
                    </PanelSection>
                    {canDelete && (
                        <PanelSection>
                            {u.productCount > 0 ? (
                                <p className="text-[13px] text-ink-muted">
                                    Every product needs a unit, so this one can
                                    be deleted once no product is sold by it.
                                </p>
                            ) : (
                                <CompactButton
                                    variant="danger"
                                    onClick={() =>
                                        removeUnit(
                                            u,
                                            u.id,
                                            'This cannot be undone.',
                                        )
                                    }
                                >
                                    <Trash2 /> Delete unit
                                </CompactButton>
                            )}
                        </PanelSection>
                    )}
                </DetailPanel>
            );
        }
    } else {
        const rows = suppliers.filter((s) =>
            [s.name, s.supplies, s.phone].some((v) =>
                v.toLowerCase().includes(q),
            ),
        );
        const columns: RecordColumn<Supplier>[] = [
            {
                key: 'name',
                header: 'Supplier',
                render: (s) => <span className="font-medium">{s.name}</span>,
            },
            {
                key: 'supplies',
                header: 'Supplies',
                className: 'max-w-[280px] truncate',
                render: (s) => (
                    <span className="text-ink-muted">{s.supplies}</span>
                ),
            },
            {
                key: 'phone',
                header: 'Phone',
                align: 'right',
                render: (s) => (
                    <span className="text-ink-muted tabular-nums">
                        {s.phone || '—'}
                    </span>
                ),
            },
        ];
        list = (
            <RecordList
                label="Suppliers"
                columns={columns}
                rows={rows}
                rowKey={(s) => s.id}
                selected={selected}
                onSelect={select}
                isLoading={loadingSuppliers}
                empty={empty('suppliers')}
            />
        );
        const s = suppliers.find((x) => x.id === selected);
        if (s) {
            panel = (
                <DetailPanel
                    title={s.name}
                    meta="Supplier"
                    onClose={() => select(null)}
                    actions={
                        <CompactButton onClick={() => openEdit(s)}>
                            <Pencil /> Edit
                        </CompactButton>
                    }
                >
                    <PanelSection>
                        <PanelFacts
                            rows={[
                                { label: 'Phone', value: s.phone || '—' },
                                {
                                    label: 'Supplies',
                                    value: (
                                        <span className="whitespace-normal">
                                            {s.supplies || '—'}
                                        </span>
                                    ),
                                },
                            ]}
                        />
                    </PanelSection>
                    {canDelete && (
                        <PanelSection>
                            <CompactButton
                                variant="danger"
                                onClick={() =>
                                    removeSupplier(
                                        s,
                                        s.id,
                                        'This cannot be undone.',
                                    )
                                }
                            >
                                <Trash2 /> Delete supplier
                            </CompactButton>
                        </PanelSection>
                    )}
                </DetailPanel>
            );
        }
    }

    if (!panel) {
        // Nothing selected, or a selection that no longer exists (deleted, or a stale link).
        panel = selected ? (
            <Card className="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-ink-muted">
                That record couldn't be found. It may have been deleted.
            </Card>
        ) : (
            <NoSelection noun={NOUN[tab].one} />
        );
    }

    return (
        <>
            <RecordsLayout
                title="Catalog"
                subtitle={`${brands.length} brands · ${categories.length} categories · ${units.length} units · ${suppliers.length} suppliers`}
                actions={
                    <CompactButton variant="primary" onClick={openNew}>
                        <Plus /> {NOUN[tab].add}
                    </CompactButton>
                }
                toolbar={
                    <>
                        <Segmented
                            label="Catalog section"
                            value={tab}
                            onChange={setTab}
                            options={[
                                {
                                    value: 'brands',
                                    label: `Brands (${brands.length})`,
                                },
                                {
                                    value: 'categories',
                                    label: `Categories (${categories.length})`,
                                },
                                {
                                    value: 'units',
                                    label: `Units (${units.length})`,
                                },
                                {
                                    value: 'suppliers',
                                    label: `Suppliers (${suppliers.length})`,
                                },
                            ]}
                        />
                        <SearchField
                            value={search}
                            onChange={setSearch}
                            placeholder={`Search ${tab}`}
                            className="w-64"
                        />
                    </>
                }
                list={list}
                panel={panel}
            />
            {tab === 'brands' && (
                <BrandFormModal
                    open={form.isOpen}
                    onClose={form.close}
                    brand={editing as Brand | null}
                />
            )}
            {tab === 'categories' && (
                <CategoryFormModal
                    open={form.isOpen}
                    onClose={form.close}
                    category={editing as Category | null}
                />
            )}
            {tab === 'units' && (
                <UnitFormModal
                    open={form.isOpen}
                    onClose={form.close}
                    unit={editing as Unit | null}
                />
            )}
            {tab === 'suppliers' && (
                <SupplierFormModal
                    open={form.isOpen}
                    onClose={form.close}
                    supplier={editing as Supplier | null}
                />
            )}
        </>
    );
}
