import { useState } from 'react';
import { useSearchParams } from '@admin/shared/lib/router';
import { ChevronLeft, ChevronRight, ReceiptText, X } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import {
    CompactButton,
    DateField,
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
import { formatCurrency } from '@admin/shared/utils/currency';
import { dateLabel } from '@admin/shared/utils/format';
import { cn } from '@admin/shared/lib/cn';
import { useOrders } from '@admin/features/orders/hooks';
import { paymentLabel, statusTone } from '@admin/features/orders/constants';
import { STATUS_LABEL } from '@admin/features/orders/receipt';
import { OrderPanel } from '@admin/features/orders/components/OrderPanel';
import type {
    Order,
    OrderStatus,
    PaymentMethod,
} from '@admin/features/orders/types';

const PAGE_SIZE = 50;

function StatusChip({ status }: { status: Order['status'] }) {
    return (
        // The hairline ring keeps the blue-tint "Issued" chip visible on a blue-tint selected row.
        <Badge
            tone={statusTone[status]}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-ink/10 ring-inset"
        >
            {STATUS_LABEL[status]}
        </Badge>
    );
}

const COLUMNS: RecordColumn<Order>[] = [
    {
        key: 'invoice',
        header: 'Invoice',
        render: (o) => (
            <div className="leading-tight">
                <div className="font-medium tabular-nums">{o.invoice}</div>
                {/* Below 1280px the date and status columns fold in here, so customer and amount keep their room. */}
                <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted tabular-nums xl:hidden">
                    {dateLabel(o.date)} <StatusChip status={o.status} />
                </div>
            </div>
        ),
    },
    {
        key: 'date',
        header: 'Date',
        optional: true,
        render: (o) => (
            <span className="text-ink-muted tabular-nums">
                {dateLabel(o.date)}
            </span>
        ),
    },
    {
        key: 'customer',
        header: 'Customer',
        className: 'max-w-[6.5rem] xl:max-w-[220px] truncate',
        render: (o) => o.customer,
    },
    {
        key: 'payment',
        header: 'Payment',
        optional: 'wide',
        render: (o) => (
            <span className="text-ink-muted">
                {paymentLabel[o.payment] ?? o.payment}
            </span>
        ),
    },
    {
        key: 'status',
        header: 'Status',
        optional: true,
        render: (o) => <StatusChip status={o.status} />,
    },
    {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        render: (o) => (
            <span
                className={cn(
                    'font-semibold tabular-nums',
                    o.status === 'CANCELLED' && 'text-ink-muted line-through',
                )}
            >
                {formatCurrency(o.amount)}
            </span>
        ),
    },
];

type StatusFilter = 'ALL' | OrderStatus;
type PaymentFilter = 'ALL' | PaymentMethod;

export function OrdersPage() {
    const [params] = useSearchParams();
    const [search, setSearch] = useState(() => params.get('search') ?? '');
    const [status, setStatus] = useState<StatusFilter>('ALL');
    const [payment, setPayment] = useState<PaymentFilter>('ALL');
    const [date, setDate] = useState('');
    const [page, setPage] = useState(1);
    const debounced = useDebounce(search);
    const [selected, select] = useSelectedId();

    const filtersOn =
        !!search || status !== 'ALL' || payment !== 'ALL' || !!date;
    const { data, isLoading } = useOrders({
        search: debounced || undefined,
        status: status === 'ALL' ? undefined : status,
        payment: payment === 'ALL' ? undefined : payment,
        date: date || undefined,
        page,
        pageSize: PAGE_SIZE,
    });
    const rows = data?.items ?? [];
    const total = data?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const resetPage =
        <T,>(fn: (v: T) => void) =>
        (v: T) => {
            fn(v);
            setPage(1);
        };
    const clearAll = () => {
        setSearch('');
        setStatus('ALL');
        setPayment('ALL');
        setDate('');
        setPage(1);
    };

    return (
        <RecordsLayout
            title="Orders"
            subtitle={
                data
                    ? `${total.toLocaleString('en-US')} bill${total === 1 ? '' : 's'}${filtersOn ? ' match these filters' : ''}`
                    : '…'
            }
            toolbar={
                <>
                    <SearchField
                        value={search}
                        onChange={resetPage(setSearch)}
                        placeholder="Search invoice or customer"
                        className="w-64"
                    />
                    <Segmented
                        label="Status"
                        value={status}
                        onChange={resetPage(setStatus)}
                        options={[
                            { value: 'ALL', label: 'All' },
                            { value: 'PENDING', label: 'Pending' },
                            { value: 'ISSUED', label: 'Issued' },
                            { value: 'COMPLETED', label: 'Completed' },
                            { value: 'CANCELLED', label: 'Cancelled' },
                        ]}
                    />
                    <MiniSelect
                        aria-label="Payment method"
                        value={payment}
                        onChange={resetPage(setPayment)}
                        className="w-40"
                        options={[
                            { value: 'ALL', label: 'Any payment' },
                            { value: 'CASH', label: 'Cash' },
                            { value: 'CARD', label: 'Card' },
                            { value: 'BANK TRANSFER', label: 'Bank transfer' },
                            { value: 'CHEQUE', label: 'Cheque' },
                            { value: 'CREDIT', label: 'Credit' },
                        ]}
                    />
                    <DateField
                        aria-label="Date"
                        value={date}
                        onChange={(e) => resetPage(setDate)(e.target.value)}
                    />
                    {filtersOn && (
                        <CompactButton variant="ghost" onClick={clearAll}>
                            <X /> Clear filters
                        </CompactButton>
                    )}
                </>
            }
            list={
                <RecordList
                    label="Bills"
                    columns={COLUMNS}
                    rows={rows}
                    rowKey={(o) => o.invoice}
                    selected={selected}
                    onSelect={select}
                    isLoading={isLoading}
                    rowTone={(o) =>
                        o.status === 'CANCELLED' ? 'muted' : undefined
                    }
                    empty={
                        <PanelEmpty
                            icon={<ReceiptText className="size-6" />}
                            title={
                                filtersOn
                                    ? 'No bills match these filters'
                                    : 'No bills yet'
                            }
                            description={
                                filtersOn
                                    ? 'Try a different status, payment or date, or clear the filters.'
                                    : 'Bills appear here as soon as they are rung up at the cashier.'
                            }
                        />
                    }
                    footer={
                        total > PAGE_SIZE ? (
                            <div className="flex items-center justify-between px-5 py-2 text-[13px] text-ink-muted tabular-nums">
                                <span>
                                    {(page - 1) * PAGE_SIZE + 1}–
                                    {Math.min(total, page * PAGE_SIZE)} of{' '}
                                    {total.toLocaleString('en-US')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CompactButton
                                        aria-label="Previous page"
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                        className="px-2"
                                    >
                                        <ChevronLeft />
                                    </CompactButton>
                                    <span className="px-1">
                                        Page {page} of {pages}
                                    </span>
                                    <CompactButton
                                        aria-label="Next page"
                                        disabled={page >= pages}
                                        onClick={() => setPage(page + 1)}
                                        className="px-2"
                                    >
                                        <ChevronRight />
                                    </CompactButton>
                                </span>
                            </div>
                        ) : undefined
                    }
                />
            }
            panel={
                selected ? (
                    <OrderPanel
                        key={selected}
                        invoice={selected}
                        onClose={() => select(null)}
                    />
                ) : (
                    <NoSelection noun="a bill" />
                )
            }
        />
    );
}
