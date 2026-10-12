import type { ReactNode } from 'react';
import { Link } from '@admin/shared/lib/router';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card } from '@admin/shared/components/Card';
import { formatCurrency } from '@admin/shared/utils/currency';
import { cn } from '@admin/shared/lib/cn';
import { percentChange } from '@admin/shared/utils/format';
import { useShopSettings } from '@admin/features/settings/shop';
import type { DashboardSummary } from '@admin/features/dashboard/types';

function plural(n: number, one: string, many = one + 's') {
    return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

/** Signed change vs a named period. Arrow + sign carry direction, so colour is never the only cue. */
function Delta({
    current,
    previous,
    period,
}: {
    current: number;
    previous: number;
    period: string;
}) {
    const pct = percentChange(current, previous);
    if (pct === null) {
        return (
            <span className="text-ink-muted">
                {current > 0
                    ? `No sales ${period} to compare`
                    : `None ${period} either`}
            </span>
        );
    }
    const flat = Math.abs(pct) < 0.5;
    const up = pct > 0;
    const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className={cn(
                    'inline-flex items-center gap-0.5 rounded-md px-1.5 py-px text-xs font-semibold',
                    flat
                        ? 'bg-canvas text-ink-muted'
                        : up
                          ? 'bg-success-bg text-success-text'
                          : 'bg-danger-bg text-danger-text',
                )}
            >
                <Icon className="size-3" strokeWidth={2.5} />
                {flat
                    ? '0%'
                    : `${up ? '+' : '−'}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`}
            </span>
            <span className="text-ink-muted">vs {period}</span>
        </span>
    );
}

interface StatProps {
    label: string;
    /** Secondary count shown opposite the label, e.g. the number of bills. */
    aside?: string;
    value: ReactNode;
    meta: ReactNode;
    to?: string;
}

function Stat({ label, aside, value, meta, to }: StatProps) {
    const body = (
        <>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate font-medium text-ink-muted">
                    {label}
                </span>
                {aside && (
                    <span className="shrink-0 text-ink-muted tabular-nums">
                        {aside}
                    </span>
                )}
            </div>
            <div className="mt-1.5 truncate text-[26px] leading-8 font-semibold tracking-[-0.02em] text-ink tabular-nums">
                {value}
            </div>
            <div className="mt-2 flex min-h-5 items-center text-[13px] tabular-nums">
                {meta}
            </div>
        </>
    );
    const base = 'block min-w-0 px-5 py-4 bg-canvas-card';
    return to ? (
        <Link
            to={to}
            className={cn(
                base,
                'transition-colors hover:bg-canvas/50 focus-visible:-outline-offset-2',
            )}
        >
            {body}
        </Link>
    ) : (
        <div className={base}>{body}</div>
    );
}

export function StatStrip({ data }: { data: DashboardSummary }) {
    const lowStock = useShopSettings().lowStock;
    return (
        <Card className="grid grid-cols-2 gap-px overflow-hidden bg-line xl:grid-cols-4">
            <Stat
                label="Today's sales"
                aside={plural(data.todayOrders, 'bill')}
                value={formatCurrency(data.todaySales)}
                // Orders carry no time of day, so a % against all of yesterday would punish every morning.
                meta={
                    <span className="text-ink-muted">
                        Yesterday:{' '}
                        <span className="font-medium text-ink">
                            {formatCurrency(data.yesterdaySales)}
                        </span>
                    </span>
                }
            />
            <Stat
                label="This month"
                aside={plural(data.monthOrders, 'bill')}
                value={formatCurrency(data.monthSales)}
                meta={
                    <Delta
                        current={data.monthSales}
                        previous={data.prevMonthSalesToDate}
                        period="last month"
                    />
                }
            />
            <Stat
                label="Outstanding credit"
                value={formatCurrency(data.outstandingCredit)}
                meta={
                    <span className="text-ink-muted">
                        {data.customersWithBalance > 0
                            ? `Owed by ${plural(data.customersWithBalance, 'customer')}`
                            : 'Nothing owed'}
                    </span>
                }
                to="/admin/customers"
            />
            <Stat
                label="Low stock"
                value={plural(data.lowStockCount, 'item')}
                meta={
                    data.lowStockCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-warning-text">
                            <span
                                className="size-1.5 rounded-full bg-warning-text"
                                aria-hidden
                            />
                            At or below {lowStock} units
                        </span>
                    ) : (
                        <span className="text-ink-muted">
                            Everything above {lowStock} units
                        </span>
                    )
                }
                to="/admin/inventory"
            />
        </Card>
    );
}
