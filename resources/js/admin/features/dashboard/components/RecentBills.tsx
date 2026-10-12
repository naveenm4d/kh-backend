import { useNavigate } from '@admin/shared/lib/router';
import { ReceiptText } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { formatCurrency } from '@admin/shared/utils/currency';
import { cn } from '@admin/shared/lib/cn';
import { paymentLabel, statusTone } from '@admin/features/orders/constants';
import { Panel, PanelEmpty } from '@admin/shared/components/Panel';
import { relativeDay } from '@admin/shared/utils/format';
import type { RecentOrder } from '@admin/features/dashboard/types';

const th =
    'px-3 first:pl-5 last:pr-5 py-2 text-xs font-medium text-ink-muted text-left whitespace-nowrap';
const td = 'px-3 first:pl-5 last:pr-5 py-2.5 whitespace-nowrap';

export function RecentBills({
    data,
    todayIso,
}: {
    data: RecentOrder[];
    todayIso: string;
}) {
    const navigate = useNavigate();
    return (
        <Panel
            title="Recent bills"
            action={{ label: 'All orders', to: '/admin/orders' }}
        >
            {data.length === 0 ? (
                <PanelEmpty
                    icon={<ReceiptText className="size-6" />}
                    title="No bills yet"
                    description="Bills appear here as soon as they're rung up at the cashier."
                />
            ) : (
                <div className="overflow-x-auto pb-1.5">
                    <table className="w-full text-[13px]">
                        <thead className="border-y border-line bg-canvas/50">
                            <tr>
                                <th className={th}>Invoice</th>
                                <th className={th}>Customer</th>
                                <th className={th}>Date</th>
                                <th className={th}>Payment</th>
                                <th className={th}>Status</th>
                                <th className={cn(th, 'text-right')}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((o) => {
                                const cancelled = o.status === 'CANCELLED';
                                return (
                                    <tr
                                        key={o.invoice}
                                        onClick={() =>
                                            navigate(
                                                `/admin/orders?id=${o.invoice}`,
                                            )
                                        }
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
                                                    navigate(
                                                        `/admin/orders?id=${o.invoice}`,
                                                    )
                                                )}
                                            >
                                                {o.invoice}
                                            </button>
                                        </td>
                                        <td
                                            className={cn(
                                                td,
                                                'max-w-[180px] truncate text-ink',
                                            )}
                                        >
                                            {o.customer}
                                        </td>
                                        <td
                                            className={cn(
                                                td,
                                                'text-ink-muted tabular-nums',
                                            )}
                                        >
                                            {relativeDay(o.date, todayIso)}
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
                    </table>
                </div>
            )}
        </Panel>
    );
}
