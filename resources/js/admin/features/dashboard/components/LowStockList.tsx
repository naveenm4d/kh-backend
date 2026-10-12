import { Link } from '@admin/shared/lib/router';
import { PackageCheck } from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';
import { useStockThresholds } from '@admin/features/settings/shop';
import { unitCount } from '@admin/shared/utils/format';
import { Panel, PanelEmpty, PanelMore } from '@admin/shared/components/Panel';
import type { LowStockItem } from '@admin/features/dashboard/types';

// Rows arrive fewest-first from the backend, so urgency reads top-down; severity is carried by the
// count's text and tone, never by a bar whose fill would give the least urgent row the most ink.
export function LowStockList({
    data,
    count,
}: {
    data: LowStockItem[];
    count: number;
}) {
    const { low: LOW_STOCK_THRESHOLD, critical: CRITICAL_STOCK } =
        useStockThresholds();
    const more = count - data.length;
    return (
        <Panel
            title="Running low"
            description={
                count > 0
                    ? `${count} item${count === 1 ? '' : 's'} at or below ${LOW_STOCK_THRESHOLD} units`
                    : undefined
            }
            action={{ label: 'Inventory', to: '/admin/inventory' }}
        >
            {data.length === 0 ? (
                <PanelEmpty
                    icon={<PackageCheck className="size-6" />}
                    title="Everything is well stocked"
                    description={`Items drop in here when stock falls to ${LOW_STOCK_THRESHOLD} or fewer.`}
                />
            ) : (
                <ul className="px-5 pb-2">
                    {data.map((p) => {
                        const out = p.stock <= 0;
                        const critical = p.stock <= CRITICAL_STOCK;
                        return (
                            <li
                                key={p.id}
                                className="border-b border-line/70 last:border-0"
                            >
                                <Link
                                    to={`/admin/inventory?id=${p.id}`}
                                    className="-mx-2 flex h-[43px] items-center gap-3 rounded-md px-2 text-[13px] transition-colors hover:bg-canvas/70"
                                >
                                    <span
                                        className="min-w-0 flex-1 truncate font-medium text-ink"
                                        title={`${p.name} · ${p.group}`}
                                    >
                                        {p.name}
                                    </span>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                                            critical
                                                ? 'bg-danger-bg text-danger-text'
                                                : 'bg-warning-bg text-warning-text',
                                        )}
                                    >
                                        {out
                                            ? 'Out of stock'
                                            : `${unitCount(p.stock, p.unit, p.measured)} left`}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                    {more > 0 && (
                        <li className="pt-2.5 pb-1">
                            <PanelMore to="/admin/inventory" total={count} />
                        </li>
                    )}
                </ul>
            )}
        </Panel>
    );
}
