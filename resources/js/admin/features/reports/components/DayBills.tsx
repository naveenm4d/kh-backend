import { useNavigate } from '@admin/shared/lib/router';
import { ReceiptText } from 'lucide-react';
import { Panel, PanelEmpty } from '@admin/shared/components/Panel';
import { Badge } from '@admin/shared/components/Badge';
import { formatCurrency } from '@admin/shared/utils/currency';
import { cn } from '@admin/shared/lib/cn';
import { useOrders } from '@admin/features/orders/hooks';
import { paymentLabel, statusTone } from '@admin/features/orders/constants';
import { formatKey } from '@admin/features/reports/periods';

const th =
    'px-3 first:pl-5 last:pr-5 py-2 text-xs font-medium text-ink-muted text-left whitespace-nowrap';
const td = 'px-3 first:pl-5 last:pr-5 py-2.5 whitespace-nowrap';

/** A single day's bills: the "what happened on the 14th" view, for reconciling the till. */
export function DayBills({ date }: { date: string }) {
    const { data, isLoading } = useOrders({ date, pageSize: 500 });
    const navigate = useNavigate();
    const open = (invoice: string) => navigate(`/admin/orders?id=${invoice}`);
    const bills = data?.items ?? [];
    // Report figures exclude cancelled bills; count and total them the same way so the two reconcile.
    const active = bills.filter((o) => o.status !== 'CANCELLED');
    const cancelled = bills.length - active.length;
    const total = active.reduce((s, o) => s + o.amount, 0);

    return (
        <Panel
            title={`Bills on ${formatKey(date, true)}`}
            description={
                isLoading
                    ? 'Loading…'
                    : `${active.length} bill${active.length === 1 ? '' : 's'}${cancelled ? ` · ${cancelled} cancelled` : ''}`
            }
        >
            {!isLoading && bills.length === 0 ? (
                <PanelEmpty
                    icon={<ReceiptText className="size-6" />}
                    title="No bills that day"
                    description="Nothing was rung up at the cashier on this date."
                />
            ) : (
                <div className="overflow-x-auto pb-1.5">
                    <table className="w-full text-[13px]">
                        <thead className="border-y border-line bg-canvas/50">
                            <tr>
                                <th className={th}>Invoice</th>
                                <th className={th}>Customer</th>
                                <th className={th}>Cashier</th>
                                <th className={th}>Payment</th>
                                <th className={th}>Status</th>
                                <th className={cn(th, 'text-right')}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map((o) => {
                                const cancelled = o.status === 'CANCELLED';
                                return (
                                    <tr
                                        key={o.invoice}
                                        onClick={() => open(o.invoice)}
                                        className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-canvas/50"
                                    >
                                        <td
                                            className={cn(
                                                td,
                                                'font-medium text-ink tabular-nums',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                className="rounded hover:text-brand-600"
                                                onClick={(e) => (
                                                    e.stopPropagation(),
                                                    open(o.invoice)
                                                )}
                                            >
                                                {o.invoice}
                                            </button>
                                        </td>
                                        <td
                                            className={cn(
                                                td,
                                                'max-w-[200px] truncate text-ink',
                                            )}
                                        >
                                            {o.customer}
                                        </td>
                                        <td
                                            className={cn(td, 'text-ink-muted')}
                                        >
                                            {o.cashier}
                                        </td>
                                        <td
                                            className={cn(td, 'text-ink-muted')}
                                        >
                                            {paymentLabel[o.payment] ??
                                                o.payment}
                                        </td>
                                        <td className={td}>
                                            <Badge
                                                tone={statusTone[o.status]}
                                                className="rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize"
                                            >
                                                {o.status.toLowerCase()}
                                            </Badge>
                                        </td>
                                        <td
                                            className={cn(
                                                td,
                                                'text-right font-semibold tabular-nums',
                                                cancelled
                                                    ? 'text-ink-muted line-through'
                                                    : 'text-ink',
                                            )}
                                        >
                                            {formatCurrency(o.amount)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="border-t border-line">
                            <tr>
                                <td
                                    className={cn(td, 'text-ink-muted')}
                                    colSpan={5}
                                >
                                    Total
                                    {cancelled ? ', excluding cancelled' : ''}
                                </td>
                                <td
                                    className={cn(
                                        td,
                                        'text-right font-semibold text-ink tabular-nums',
                                    )}
                                >
                                    {formatCurrency(total)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </Panel>
    );
}
