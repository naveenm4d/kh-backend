import { useState } from 'react';
import { useNavigate } from '@admin/shared/lib/router';
import { HandCoins, Pencil, ReceiptText, Trash2 } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { CompactButton } from '@admin/shared/components/controls';
import {
    DetailPanel,
    PanelFigures,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { Card } from '@admin/shared/components/Card';
import { useToast } from '@admin/shared/components/Toast';
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { formatCurrency } from '@admin/shared/utils/currency';
import { dateLabel, plural } from '@admin/shared/utils/format';
import { cn } from '@admin/shared/lib/cn';
import { paymentLabel, statusTone } from '@admin/features/orders/constants';
import {
    useCustomer,
    useDeleteCustomer,
} from '@admin/features/customers/hooks';
import { RecordPaymentForm } from '@admin/features/customers/components/RecordPaymentForm';
import { OrderPanel } from '@admin/features/orders/components/OrderPanel';
import { useSelectedId } from '@admin/shared/components/records/useSelectedId';
import { useCan } from '@admin/features/auth/hooks';
import { customerHistory } from '@admin/features/customers/payment';
import type { CustomerDetail } from '@admin/features/customers/types';

export function CustomerPanel({
    id,
    onClose,
    onEdit,
    onDeleted,
}: {
    id: string;
    onClose: () => void;
    onEdit: (c: CustomerDetail) => void;
    onDeleted: () => void;
}) {
    const { data: c, isLoading, isError } = useCustomer(id);
    const [paying, setPaying] = useState(false);
    const remove = useDeleteCustomer();
    const navigate = useNavigate();
    // A bill opened from the history replaces the panel (with a way back); it lives in ?bill= so back/forward work.
    const [bill, openBill] = useSelectedId('bill');
    const canPay = useCan('customers.payment');
    const canDelete = useCan('records.delete');
    const canSeeOrders = useCan('page.orders');
    const confirm = useConfirm();
    const toast = useToast();

    if (isError) {
        return (
            <Card className="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-ink-muted">
                This customer couldn't be found. They may have been deleted.
            </Card>
        );
    }
    if (isLoading || !c)
        return <Card className="flex-1 animate-pulse" aria-busy="true" />;
    if (bill)
        return (
            <OrderPanel
                key={bill}
                invoice={bill}
                onClose={onClose}
                onBack={{ label: c.name, onClick: () => openBill(null) }}
            />
        );

    const owes = c.credit > 0;
    const entries = customerHistory(c);

    const handleDelete = async () => {
        const ok = await confirm({
            title: `Delete ${c.name}?`,
            description: owes
                ? `${c.name} still owes ${formatCurrency(c.credit)}. Deleting removes the customer and that balance. Their bills stay in order history.`
                : 'Their bills stay in order history. This cannot be undone.',
            confirmLabel: 'Delete customer',
            danger: true,
        });
        if (!ok) return;
        try {
            await remove.mutateAsync(c.id);
            toast.success(`${c.name} deleted`);
            onDeleted();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not delete the customer',
            );
        }
    };

    return (
        <DetailPanel
            title={c.name}
            meta={
                [c.phone, c.address].filter(Boolean).join(' · ') ||
                'No contact details'
            }
            badge={
                owes ? (
                    <Badge
                        tone="warning"
                        className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                    >
                        Owes
                    </Badge>
                ) : null
            }
            onClose={onClose}
            actions={
                <>
                    {owes && !paying && canPay && (
                        <CompactButton
                            variant="primary"
                            onClick={() => setPaying(true)}
                        >
                            <HandCoins /> Record payment
                        </CompactButton>
                    )}
                    <CompactButton onClick={() => onEdit(c)}>
                        <Pencil /> Edit
                    </CompactButton>
                    {canSeeOrders && (
                        <CompactButton
                            variant="ghost"
                            onClick={() =>
                                navigate(
                                    `/admin/orders?search=${encodeURIComponent(c.name)}`,
                                )
                            }
                        >
                            <ReceiptText /> In orders
                        </CompactButton>
                    )}
                </>
            }
        >
            <PanelFigures
                items={[
                    {
                        label: 'Owes',
                        value: owes ? formatCurrency(c.credit) : 'Nothing',
                        tone: owes ? 'warning' : undefined,
                    },
                    { label: 'Spent', value: formatCurrency(c.spent) },
                    {
                        label: 'Bills',
                        value: c.orderCount.toLocaleString('en-US'),
                    },
                ]}
            />

            {paying && (
                <PanelSection title="Record a payment">
                    <RecordPaymentForm
                        customerId={c.id}
                        owed={c.credit}
                        onDone={() => setPaying(false)}
                    />
                </PanelSection>
            )}

            <PanelSection
                title="History"
                aside={
                    entries.length
                        ? `${plural(c.bills.length, 'bill')} · ${plural(c.payments.length, 'payment')}`
                        : undefined
                }
            >
                {entries.length === 0 ? (
                    <div className="py-2 text-[13px] text-ink-muted">
                        No bills or payments yet.
                    </div>
                ) : (
                    <ul className="-mx-2">
                        {entries.map((e) =>
                            e.kind === 'bill' ? (
                                <li key={e.key}>
                                    <button
                                        type="button"
                                        onClick={() => openBill(e.bill.invoice)}
                                        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-canvas/70"
                                    >
                                        <div className="min-w-0 flex-1 leading-tight">
                                            <div className="text-[13px] font-medium text-ink tabular-nums">
                                                {e.bill.invoice}
                                            </div>
                                            <div className="mt-0.5 text-xs text-ink-muted tabular-nums">
                                                {dateLabel(e.bill.date)} ·{' '}
                                                {paymentLabel[e.bill.payment]}
                                            </div>
                                        </div>
                                        <Badge
                                            tone={statusTone[e.bill.status]}
                                            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold capitalize"
                                        >
                                            {e.bill.status.toLowerCase()}
                                        </Badge>
                                        <span
                                            className={cn(
                                                'w-24 text-right text-[13px] font-semibold tabular-nums',
                                                e.bill.status === 'CANCELLED'
                                                    ? 'text-ink-muted line-through'
                                                    : 'text-ink',
                                            )}
                                        >
                                            {formatCurrency(e.bill.amount)}
                                        </span>
                                    </button>
                                </li>
                            ) : (
                                <li
                                    key={e.key}
                                    className="flex items-center gap-3 px-2 py-2"
                                >
                                    <div className="min-w-0 flex-1 leading-tight">
                                        <div className="text-[13px] font-medium text-ink">
                                            Payment received
                                        </div>
                                        <div className="mt-0.5 truncate text-xs text-ink-muted tabular-nums">
                                            {dateLabel(e.payment.date)} ·{' '}
                                            {paymentLabel[e.payment.method]}
                                            {e.payment.note
                                                ? ` · ${e.payment.note}`
                                                : ''}
                                        </div>
                                    </div>
                                    <span className="w-24 text-right text-[13px] font-semibold text-success-text tabular-nums">
                                        −{formatCurrency(e.payment.amount)}
                                    </span>
                                </li>
                            ),
                        )}
                    </ul>
                )}
            </PanelSection>

            {canDelete && (
                <PanelSection>
                    <CompactButton
                        variant="danger"
                        onClick={handleDelete}
                        busy={remove.isPending}
                    >
                        <Trash2 /> Delete customer
                    </CompactButton>
                </PanelSection>
            )}
        </DetailPanel>
    );
}
