import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import {
    CompactButton,
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
import { dateLabel } from '@admin/shared/utils/format';
import { useCustomers } from '@admin/features/customers/hooks';
import { useCan } from '@admin/features/auth/hooks';
import { CustomerAvatar } from '@admin/features/customers/components/CustomerAvatar';
import { CustomerFormModal } from '@admin/features/customers/components/CustomerFormModal';
import { CustomerPanel } from '@admin/features/customers/components/CustomerPanel';
import type {
    Customer,
    CustomerWithStats,
} from '@admin/features/customers/types';

type Filter = 'all' | 'owing';

const COLUMNS: RecordColumn<CustomerWithStats>[] = [
    {
        key: 'name',
        header: 'Customer',
        render: (c) => (
            <span className="flex min-w-0 items-center gap-2.5">
                <CustomerAvatar
                    mono
                    name={c.name}
                    className="size-6 text-[10px] font-semibold"
                />
                <span className="truncate font-medium text-ink">{c.name}</span>
            </span>
        ),
    },
    {
        key: 'phone',
        header: 'Phone',
        optional: true,
        render: (c) => (
            <span className="text-ink-muted tabular-nums">
                {c.phone || '—'}
            </span>
        ),
    },
    {
        key: 'owes',
        header: 'Owes',
        align: 'right',
        render: (c) =>
            c.credit > 0 ? (
                <span className="font-semibold text-warning-text tabular-nums">
                    {formatCurrency(c.credit)}
                </span>
            ) : (
                <span className="text-ink-muted">—</span>
            ),
    },
    {
        key: 'spent',
        header: 'Spent',
        align: 'right',
        optional: 'wide',
        render: (c) => (
            <span className="tabular-nums">{formatCurrency(c.spent)}</span>
        ),
    },
    {
        key: 'bills',
        header: 'Bills',
        align: 'right',
        optional: 'wide',
        render: (c) => (
            <span className="text-ink-muted tabular-nums">{c.orderCount}</span>
        ),
    },
    {
        key: 'last',
        header: 'Last bill',
        align: 'right',
        optional: true,
        render: (c) => (
            <span className="text-ink-muted tabular-nums">
                {dateLabel(c.lastPurchase)}
            </span>
        ),
    },
];

export function CustomersPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const debounced = useDebounce(search);
    const { data, isLoading } = useCustomers({
        search: debounced,
        owing: filter === 'owing' || undefined,
        pageSize: 500,
    });
    const { data: owingData } = useCustomers({ owing: true, pageSize: 500 });
    const [selected, select] = useSelectedId();
    const canPay = useCan('customers.payment');
    const form = useDisclosure();
    const [editing, setEditing] = useState<Customer | null>(null);

    const rows = data?.items ?? [];
    const owing = owingData?.items ?? [];
    const totalOwed = owing.reduce((s, c) => s + c.credit, 0);

    return (
        <>
            <RecordsLayout
                title="Customers"
                subtitle={
                    <>
                        {data
                            ? `${data.total} ${filter === 'owing' ? 'owing' : 'customers'}`
                            : '…'}
                        {owing.length > 0 &&
                            ` · ${formatCurrency(totalOwed)} owed by ${owing.length}`}
                    </>
                }
                actions={
                    <CompactButton
                        variant="primary"
                        onClick={() => {
                            setEditing(null);
                            form.open();
                        }}
                    >
                        <Plus /> New customer
                    </CompactButton>
                }
                toolbar={
                    <>
                        <SearchField
                            value={search}
                            onChange={setSearch}
                            placeholder="Search name, phone or address"
                            className="w-72"
                        />
                        <Segmented
                            label="Show"
                            value={filter}
                            onChange={setFilter}
                            options={[
                                { value: 'all', label: 'All' },
                                {
                                    value: 'owing',
                                    label: `Owes money${owing.length ? ` (${owing.length})` : ''}`,
                                },
                            ]}
                        />
                    </>
                }
                list={
                    <RecordList
                        label="Customers"
                        columns={COLUMNS}
                        rows={rows}
                        rowKey={(c) => c.id}
                        selected={selected}
                        onSelect={select}
                        isLoading={isLoading}
                        empty={
                            <PanelEmpty
                                icon={<Users className="size-6" />}
                                title={
                                    search
                                        ? `No customers match "${search}"`
                                        : filter === 'owing'
                                          ? 'Nobody owes money'
                                          : 'No customers yet'
                                }
                                description={
                                    search
                                        ? 'Try a name, part of a phone number, or a town.'
                                        : undefined
                                }
                            />
                        }
                    />
                }
                panel={
                    selected ? (
                        <CustomerPanel
                            key={selected}
                            id={selected}
                            onClose={() => select(null)}
                            onEdit={(c) => {
                                setEditing(c);
                                form.open();
                            }}
                            onDeleted={() => select(null)}
                        />
                    ) : (
                        <NoSelection noun="a customer" />
                    )
                }
            />
            <CustomerFormModal
                open={form.isOpen}
                onClose={form.close}
                customer={editing}
                showCredit={canPay}
                onSaved={(c) => !editing && select(c.id)}
            />
        </>
    );
}
