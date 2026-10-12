import { Layers } from 'lucide-react';
import { formatCurrency } from '@admin/shared/utils/currency';
import { Panel, PanelEmpty } from '@admin/shared/components/Panel';
import type { CategoryBreakdownItem } from '@admin/features/dashboard/types';

/** Ranked bars in one hue: it's one measure, and the label names each row. */
export function CategoryBreakdown({ data }: { data: CategoryBreakdownItem[] }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <Panel
            title="Revenue by category"
            description="All time · revenue from units sold"
            bodyClassName="px-5 pb-4"
        >
            {total === 0 ? (
                <PanelEmpty
                    icon={<Layers className="size-6" />}
                    title="No category revenue yet"
                />
            ) : (
                <ul className="flex flex-col gap-3">
                    {data.map((item) => (
                        <li key={item.group}>
                            <div className="flex items-center gap-2 text-[13px]">
                                <span className="flex-1 truncate font-medium text-ink">
                                    {item.group}
                                </span>
                                <span className="text-ink-muted tabular-nums">
                                    {formatCurrency(item.value)}
                                </span>
                                <span className="w-10 text-right font-medium text-ink tabular-nums">
                                    {Math.round((item.value / total) * 100)}%
                                </span>
                            </div>
                            <div
                                className="mt-1.5 h-1.5 rounded-full bg-brand-50"
                                aria-hidden
                            >
                                <div
                                    className="h-full rounded-full bg-brand-500"
                                    style={{
                                        width: `${(item.value / max) * 100}%`,
                                    }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
