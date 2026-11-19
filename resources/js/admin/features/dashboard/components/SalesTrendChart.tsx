import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@admin/shared/utils/currency';
import { cn } from '@admin/shared/lib/cn';
import { Panel, PanelEmpty } from '@admin/shared/components/Panel';
import {
    compactRupees,
    niceScale,
    shortDate,
} from '@admin/shared/utils/format';
import type { DailyTrendPoint } from '@admin/features/dashboard/types';

const TICKS = 4;

/** 14-day column chart. The last point is always today (the backend builds the window ending today). */
export function SalesTrendChart({ data }: { data: DailyTrendPoint[] }) {
    const [active, setActive] = useState<number | null>(null);
    const total = data.reduce((sum, d) => sum + d.total, 0);
    const { ceiling, step } = niceScale(
        Math.max(...data.map((d) => d.total), 0),
        TICKS,
    );
    const ticks = Array.from({ length: TICKS + 1 }, (_, i) => i * step);
    const lastIndex = data.length - 1;

    return (
        <Panel
            title="Sales"
            description={
                <>
                    Last 14 days ·{' '}
                    <span className="font-medium text-ink">
                        {formatCurrency(total)}
                    </span>
                </>
            }
            bodyClassName="px-5 pb-4"
        >
            {total === 0 ? (
                <div className="h-full min-h-[232px]">
                    <PanelEmpty
                        icon={<BarChart3 className="size-6" />}
                        title="No sales in the last 14 days"
                        description="Bills rung up at the cashier will show here day by day."
                    />
                </div>
            ) : (
                <div className="flex h-full min-h-[232px] gap-3">
                    {/* y-axis */}
                    <div className="relative mb-6 w-9 shrink-0" aria-hidden>
                        {ticks.map((t) => (
                            <div
                                key={t}
                                className="absolute right-0 translate-y-1/2 text-[11px] text-ink-muted tabular-nums"
                                style={{ bottom: `${(t / ceiling) * 100}%` }}
                            >
                                {compactRupees(t)}
                            </div>
                        ))}
                    </div>

                    <div className="relative flex min-w-0 flex-1 flex-col">
                        {/* plot */}
                        <div className="relative flex-1">
                            {ticks.map((t) => (
                                <div
                                    key={t}
                                    className={cn(
                                        'absolute inset-x-0 h-px',
                                        t === 0
                                            ? 'bg-ink-subtle/60'
                                            : 'bg-line/70',
                                    )}
                                    style={{
                                        bottom: `${(t / ceiling) * 100}%`,
                                    }}
                                    aria-hidden
                                />
                            ))}
                            <div
                                className="absolute inset-0 flex"
                                role="list"
                                aria-label="Daily sales, last 14 days"
                            >
                                {data.map((d, i) => {
                                    const isToday = i === lastIndex;
                                    const isActive = active === i;
                                    const pct = (d.total / ceiling) * 100;
                                    return (
                                        <div
                                            key={d.date}
                                            role="listitem"
                                            tabIndex={0}
                                            aria-label={`${isToday ? 'Today' : shortDate(d.date)}: ${formatCurrency(d.total)}`}
                                            onMouseEnter={() => setActive(i)}
                                            onMouseLeave={() => setActive(null)}
                                            onFocus={() => setActive(i)}
                                            onBlur={() => setActive(null)}
                                            className="group relative flex h-full flex-1 items-end justify-center outline-none"
                                        >
                                            <div
                                                className={cn(
                                                    'absolute inset-x-0.5 inset-y-0 rounded-md transition-colors',
                                                    isActive && 'bg-canvas',
                                                )}
                                                aria-hidden
                                            />
                                            <div
                                                className={cn(
                                                    'relative w-[60%] max-w-6 rounded-t-[4px] transition-colors',
                                                    isToday
                                                        ? 'bg-brand-500'
                                                        : isActive
                                                          ? 'bg-brand-400'
                                                          : 'bg-brand-200',
                                                    d.total > 0 &&
                                                        'min-h-[3px]',
                                                )}
                                                style={{ height: `${pct}%` }}
                                            />
                                            {isActive && (
                                                <div
                                                    className={cn(
                                                        'pointer-events-none absolute z-10 rounded-lg bg-ink px-2.5 py-1.5 whitespace-nowrap text-white shadow-lg',
                                                        i < 2
                                                            ? 'left-0'
                                                            : i > lastIndex - 2
                                                              ? 'right-0'
                                                              : 'left-1/2 -translate-x-1/2',
                                                    )}
                                                    style={{
                                                        bottom: `calc(${Math.max(pct, 0)}% + 8px)`,
                                                    }}
                                                >
                                                    <div className="text-[11px] text-white/70">
                                                        {isToday
                                                            ? 'Today'
                                                            : shortDate(d.date)}
                                                    </div>
                                                    <div className="text-[13px] font-semibold tabular-nums">
                                                        {formatCurrency(
                                                            d.total,
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* x-axis */}
                        <div className="flex h-6 items-end" aria-hidden>
                            {data.map((d, i) => (
                                <div
                                    key={d.date}
                                    className={cn(
                                        'flex-1 text-center text-[11px] tabular-nums',
                                        i === lastIndex
                                            ? 'font-medium text-ink'
                                            : 'text-ink-muted',
                                    )}
                                >
                                    {/* first column and the 1st of a month carry the month so the axis reads across a boundary */}
                                    {i === lastIndex
                                        ? 'Today'
                                        : i === 0 || d.date.endsWith('-01')
                                          ? shortDate(d.date)
                                          : Number(d.date.slice(8, 10))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Panel>
    );
}
