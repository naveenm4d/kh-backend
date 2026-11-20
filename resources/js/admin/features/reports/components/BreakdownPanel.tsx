import { useState } from 'react';
import { PieChart } from 'lucide-react';
import { Panel, PanelEmpty } from '@admin/shared/components/Panel';
import { formatCurrency } from '@admin/shared/utils/currency';
import { paymentLabel } from '@admin/features/orders/constants';
import { DeltaChip, Segmented } from '@admin/shared/components/controls';
import { formatRangeShort } from '@admin/features/reports/periods';
import type { DateRange } from '@admin/features/reports/periods';
import type { PaymentMethod } from '@admin/features/orders/types';
import type {
    ReportBreakdownItem,
    ReportSummary,
} from '@admin/features/reports/types';

type Dim = 'byPayment' | 'byCategory' | 'byCashier';

const DIMS: { value: Dim; label: string }[] = [
    { value: 'byPayment', label: 'Payment' },
    { value: 'byCategory', label: 'Category' },
    { value: 'byCashier', label: 'Cashier' },
];

function labelFor(dim: Dim, key: string) {
    return dim === 'byPayment'
        ? (paymentLabel[key as PaymentMethod] ?? key)
        : key;
}

const MAX_ROWS = 5;

/**
 * Union of A's and B's keys, ordered by A's revenue then B's, so a row that vanished in A still shows.
 * Past MAX_ROWS the tail folds into one "Other" row so the panel stays scannable.
 */
function rows(a: ReportBreakdownItem[], b: ReportBreakdownItem[]) {
    const bByKey = new Map(b.map((i) => [i.key, i]));
    const out = a.map((i) => ({
        key: i.key,
        label: i.key,
        a: i.revenue,
        b: bByKey.get(i.key)?.revenue ?? 0,
    }));
    const seen = new Set(a.map((i) => i.key));
    for (const i of b)
        if (!seen.has(i.key))
            out.push({ key: i.key, label: i.key, a: 0, b: i.revenue });
    if (out.length <= MAX_ROWS) return out;
    const head = out.slice(0, MAX_ROWS - 1);
    const tail = out.slice(MAX_ROWS - 1);
    return [
        ...head,
        {
            key: '__other',
            label: `Other (${tail.map((t) => t.key).join(', ')})`,
            a: tail.reduce((s, t) => s + t.a, 0),
            b: tail.reduce((s, t) => s + t.b, 0),
        },
    ];
}

export function BreakdownPanel({
    a,
    b,
    rangeB,
}: {
    a: ReportSummary;
    b: ReportSummary;
    rangeB: DateRange;
}) {
    const [dim, setDim] = useState<Dim>('byPayment');
    const data = rows(a[dim], b[dim]);
    const max = Math.max(...data.flatMap((r) => [r.a, r.b]), 1);
    const totalA = data.reduce((s, r) => s + r.a, 0);

    return (
        <Panel
            title="Where it came from"
            description={`Revenue split, vs ${formatRangeShort(rangeB)}`}
            className="h-full"
            bodyClassName="px-5 pb-4"
        >
            <div className="-mt-1 mb-4">
                <Segmented
                    label="Break down by"
                    value={dim}
                    onChange={setDim}
                    options={DIMS}
                />
            </div>
            {data.length === 0 ? (
                <PanelEmpty
                    icon={<PieChart className="size-6" />}
                    title="Nothing to break down"
                    description="Neither period has any sales."
                />
            ) : (
                <ul className="flex flex-col gap-3.5">
                    {data.map((r) => (
                        <li key={r.key}>
                            <div className="flex items-center gap-2 text-[13px]">
                                <span
                                    className="flex-1 truncate font-medium text-ink"
                                    title={r.label}
                                >
                                    {r.key === '__other'
                                        ? r.label
                                        : labelFor(dim, r.key)}
                                </span>
                                <span className="font-medium text-ink tabular-nums">
                                    {formatCurrency(r.a)}
                                </span>
                                <span className="w-14 text-right">
                                    <DeltaChip a={r.a} b={r.b} size="sm" />
                                </span>
                            </div>
                            <div
                                className="mt-1.5 flex flex-col gap-0.5"
                                aria-hidden
                            >
                                <div className="h-1.5 rounded-full bg-brand-50">
                                    <div
                                        className="h-full rounded-full bg-brand-500"
                                        style={{
                                            width: `${(r.a / max) * 100}%`,
                                        }}
                                    />
                                </div>
                                <div className="h-1.5 rounded-full bg-brand-50">
                                    <div
                                        className="h-full rounded-full bg-brand-200"
                                        style={{
                                            width: `${(r.b / max) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="mt-1 text-xs text-ink-muted tabular-nums">
                                {totalA > 0
                                    ? `${Math.round((r.a / totalA) * 100)}% of period`
                                    : '—'}{' '}
                                · vs {formatCurrency(r.b)}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
