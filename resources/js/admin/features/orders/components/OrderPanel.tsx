import { useState } from 'react';
import { Link } from '@admin/shared/lib/router';
import { Ban, PackageCheck, Pencil, Printer } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { Card } from '@admin/shared/components/Card';
import { CompactButton } from '@admin/shared/components/controls';
import {
    DetailPanel,
    PanelFacts,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { formatCurrency } from '@admin/shared/utils/currency';
import { dateLabel } from '@admin/shared/utils/format';
import { cn } from '@admin/shared/lib/cn';
import { useOrder } from '@admin/features/orders/hooks';
import { paymentLabel, statusTone } from '@admin/features/orders/constants';
import { OrderEditModal } from '@admin/features/orders/components/OrderEditModal';
import {
    STATUS_LABEL,
    itemDiscountPct,
    orderTotals,
} from '@admin/features/orders/receipt';
import { useOrderActions } from '@admin/features/orders/useOrderActions';
import { lineQty } from '@admin/shared/utils/units';

/** Admin order panel: facts, line items and totals, with print / issue / edit / cancel. */
export function OrderPanel({
    invoice,
    onClose,
    onBack,
}: {
    invoice: string;
    onClose: () => void;
    onBack?: { label: string; onClick: () => void };
}) {
    const { data: order, isLoading, isError } = useOrder(invoice);
    const [editing, setEditing] = useState(false);
    const {
        canIssue,
        canEdit,
        canCancel,
        print,
        issue,
        cancel,
        isPrinting,
        isIssuing,
        isCancelling,
    } = useOrderActions(order);

    if (isError) {
        return (
            <Card className="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-ink-muted">
                Bill {invoice} couldn't be found.
            </Card>
        );
    }
    if (isLoading || !order)
        return <Card className="flex-1 animate-pulse" aria-busy="true" />;

    const { subtotal, discount } = orderTotals(order);
    const cancelled = order.status === 'CANCELLED';
    // Units only add up when everything is counted; 2 bags + 1.5 kg isn't a number.
    const units = order.items.every((i) => !i.measured)
        ? order.items.reduce((n, i) => n + i.qty, 0)
        : null;

    return (
        <>
            <DetailPanel
                title={<span className="tabular-nums">{order.invoice}</span>}
                badge={
                    <Badge
                        tone={statusTone[order.status]}
                        className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                    >
                        {STATUS_LABEL[order.status]}
                    </Badge>
                }
                meta={`${dateLabel(order.date)} · by ${order.cashier}`}
                onClose={onClose}
                onBack={onBack}
                actions={
                    <>
                        {canIssue && (
                            <CompactButton
                                variant="primary"
                                onClick={issue}
                                busy={isIssuing}
                            >
                                <PackageCheck /> Mark as issued
                            </CompactButton>
                        )}
                        {/* With "Mark as issued" present, print and edit shrink to icon buttons so the row doesn't wrap. */}
                        <CompactButton
                            onClick={print}
                            busy={isPrinting}
                            aria-label="Print bill"
                            title="Print bill"
                            className={canIssue ? 'px-2' : undefined}
                        >
                            <Printer /> {!canIssue && 'Print bill'}
                        </CompactButton>
                        {canEdit && (
                            <CompactButton
                                onClick={() => setEditing(true)}
                                aria-label="Edit items"
                                title="Edit items"
                                className={canIssue ? 'px-2' : undefined}
                            >
                                <Pencil /> {!canIssue && 'Edit items'}
                            </CompactButton>
                        )}
                    </>
                }
            >
                {cancelled && (
                    <div className="mx-5 mt-4 rounded-lg bg-danger-bg px-3 py-2 text-[13px] text-danger-text">
                        This bill was cancelled. Stock was returned and any
                        credit it added was reversed.
                    </div>
                )}
                {order.payment === 'CREDIT' && order.status === 'PENDING' && (
                    <div className="mx-5 mt-4 rounded-lg bg-warning-bg px-3 py-2 text-[13px] text-warning-text">
                        On credit: {formatCurrency(order.amount)} was added to{' '}
                        {order.customer}'s balance.
                    </div>
                )}

                <PanelSection>
                    <PanelFacts
                        rows={[
                            {
                                label: 'Customer',
                                value: order.customerId ? (
                                    <Link
                                        to={`/admin/customers?id=${order.customerId}`}
                                        className="text-brand-600 underline-offset-2 hover:underline"
                                    >
                                        {order.customer}
                                    </Link>
                                ) : (
                                    order.customer
                                ),
                            },
                            {
                                label: 'Payment',
                                value:
                                    paymentLabel[order.payment] ??
                                    order.payment,
                            },
                            {
                                label: 'Items',
                                value: `${order.items.length} line${order.items.length === 1 ? '' : 's'}${units === null ? '' : ` · ${units} unit${units === 1 ? '' : 's'}`}`,
                            },
                        ]}
                    />
                </PanelSection>

                <PanelSection title="Items">
                    <ul className="flex flex-col">
                        {order.items.map((item) => {
                            const pct = itemDiscountPct(item);
                            return (
                                <li
                                    key={item.productId}
                                    className="flex items-start gap-3 border-b border-line/70 py-2 last:border-0"
                                >
                                    <div className="min-w-0 flex-1 leading-tight">
                                        <Link
                                            to={`/admin/inventory?id=${item.productId}`}
                                            className="block truncate text-[13px] font-medium text-ink hover:text-brand-600"
                                        >
                                            {item.name}
                                        </Link>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted tabular-nums">
                                            <span>
                                                {lineQty(
                                                    item.qty,
                                                    item.unit,
                                                    item.measured,
                                                )}{' '}
                                                ×{' '}
                                                {formatCurrency(item.unitPrice)}
                                            </span>
                                            {item.source && (
                                                <span className="rounded bg-canvas px-1 text-ink-muted">
                                                    {item.source === 'STORE'
                                                        ? 'Store'
                                                        : 'Warehouse'}
                                                </span>
                                            )}
                                            {pct > 0 && (
                                                <span className="rounded bg-success-bg px-1 font-medium text-success-text">
                                                    −{pct}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[13px] font-semibold text-ink tabular-nums">
                                        {formatCurrency(item.total)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-[13px] tabular-nums">
                        <div className="flex justify-between text-ink-muted">
                            <dt>Subtotal</dt>
                            <dd>{formatCurrency(subtotal)}</dd>
                        </div>
                        {discount > 0.5 && (
                            <div className="flex justify-between text-ink-muted">
                                <dt>Discount</dt>
                                <dd>−{formatCurrency(discount)}</dd>
                            </div>
                        )}
                        <div className="mt-1 flex items-baseline justify-between">
                            <dt className="font-medium text-ink">Total</dt>
                            <dd
                                className={cn(
                                    'text-lg font-semibold',
                                    cancelled
                                        ? 'text-ink-muted line-through'
                                        : 'text-ink',
                                )}
                            >
                                {formatCurrency(order.amount)}
                            </dd>
                        </div>
                    </dl>
                </PanelSection>

                {canCancel && (
                    <PanelSection>
                        <CompactButton
                            variant="danger"
                            onClick={cancel}
                            busy={isCancelling}
                        >
                            <Ban /> Cancel bill
                        </CompactButton>
                        <p className="mt-2 text-xs text-ink-muted">
                            Returns the items to stock and reverses any credit.
                            Can't be undone.
                        </p>
                    </PanelSection>
                )}
            </DetailPanel>
            <OrderEditModal
                order={editing ? order : null}
                onClose={() => setEditing(false)}
            />
        </>
    );
}
