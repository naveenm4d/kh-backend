import { Package } from 'lucide-react';
import { formatCurrency } from '@admin/shared/utils/currency';
import { cn } from '@admin/shared/lib/cn';
import { Panel, PanelEmpty } from '@admin/shared/components/Panel';
import type { TopProduct } from '@admin/features/dashboard/types';

const th =
    'px-3 first:pl-5 last:pr-5 py-2 text-xs font-medium text-ink-muted text-left whitespace-nowrap';
const td = 'px-3 first:pl-5 last:pr-5 py-2.5 whitespace-nowrap';

// Labelled without a time window: the backend's units-sold counter doesn't reset monthly yet
// (see .claude/domains/dashboard.md), so "this month" would overstate what it measures.
export function TopProductsTable({ data }: { data: TopProduct[] }) {
    return (
        <Panel
            title="Best sellers"
            description="All time · by revenue from units sold"
            action={{ label: 'Inventory', to: '/admin/inventory' }}
        >
            {data.length === 0 ? (
                <PanelEmpty
                    icon={<Package className="size-6" />}
                    title="No sales recorded yet"
                />
            ) : (
                <div className="overflow-x-auto pb-1.5">
                    <table className="w-full text-[13px]">
                        <thead className="border-y border-line bg-canvas/50">
                            <tr>
                                <th className={cn(th, 'w-8 pr-0')}>#</th>
                                <th className={th}>Product</th>
                                <th className={cn(th, 'text-right')}>Units</th>
                                <th className={cn(th, 'text-right')}>
                                    Unit price
                                </th>
                                <th className={cn(th, 'text-right')}>
                                    Revenue
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((p, i) => (
                                <tr
                                    key={p.name}
                                    className="border-b border-line/70 last:border-0"
                                >
                                    <td
                                        className={cn(
                                            td,
                                            'pr-0 text-ink-muted tabular-nums',
                                        )}
                                    >
                                        {i + 1}
                                    </td>
                                    <td
                                        className={cn(
                                            td,
                                            'max-w-[260px] truncate font-medium text-ink',
                                        )}
                                    >
                                        {p.name}
                                    </td>
                                    <td
                                        className={cn(
                                            td,
                                            'text-right text-ink-muted tabular-nums',
                                        )}
                                    >
                                        {p.units.toLocaleString('en-US')}
                                    </td>
                                    <td
                                        className={cn(
                                            td,
                                            'text-right text-ink-muted tabular-nums',
                                        )}
                                    >
                                        {formatCurrency(p.price)}
                                    </td>
                                    <td
                                        className={cn(
                                            td,
                                            'text-right font-semibold text-ink tabular-nums',
                                        )}
                                    >
                                        {formatCurrency(p.revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Panel>
    );
}
