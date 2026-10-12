import { Card } from '@admin/shared/components/Card';
import { formatCurrency } from '@admin/shared/utils/currency';
import { DeltaChip } from '@admin/shared/components/controls';
import { formatRangeShort } from '@admin/features/reports/periods';
import type { DateRange } from '@admin/features/reports/periods';
import type { ReportTotals } from '@admin/features/reports/types';

interface Measure {
    label: string;
    get: (t: ReportTotals) => number;
    format: (n: number) => string;
    tone?: 'up-good' | 'neutral';
}

const count = (n: number) => n.toLocaleString('en-US');

const MEASURES: Measure[] = [
    { label: 'Revenue', get: (t) => t.revenue, format: formatCurrency },
    { label: 'Bills', get: (t) => t.bills, format: count },
    { label: 'Average bill', get: (t) => t.avgBill, format: formatCurrency },
    // More credit isn't simply better (it's money not yet collected), so its change stays neutral.
    {
        label: 'Sold on credit',
        get: (t) => t.creditSales,
        format: formatCurrency,
        tone: 'neutral',
    },
];

export function ComparisonStrip({
    a,
    b,
    rangeB,
}: {
    a: ReportTotals;
    b: ReportTotals;
    rangeB: DateRange;
}) {
    const bLabel = formatRangeShort(rangeB);
    return (
        <Card className="grid grid-cols-2 gap-px overflow-hidden bg-line xl:grid-cols-4">
            {MEASURES.map((m) => {
                const va = m.get(a);
                const vb = m.get(b);
                return (
                    <div
                        key={m.label}
                        className="min-w-0 bg-canvas-card px-5 py-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-medium text-ink-muted">
                                {m.label}
                            </span>
                            <DeltaChip a={va} b={vb} tone={m.tone} />
                        </div>
                        <div className="mt-1.5 truncate text-[26px] leading-8 font-semibold tracking-[-0.02em] text-ink tabular-nums">
                            {m.format(va)}
                        </div>
                        <div className="mt-1 truncate text-[13px] text-ink-muted tabular-nums">
                            vs {m.format(vb)} · {bLabel}
                        </div>
                    </div>
                );
            })}
        </Card>
    );
}
