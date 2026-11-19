import { ChevronRight } from 'lucide-react';
import { Panel } from '@admin/shared/components/Panel';
import { formatCurrency } from '@admin/shared/utils/currency';
import { cn } from '@admin/shared/lib/cn';
import { DeltaChip, Swatch } from '@admin/shared/components/controls';
import { formatKey } from '@admin/features/reports/periods';
import type { ReportSeriesPoint } from '@admin/features/reports/types';

const th =
    'px-3 first:pl-5 last:pr-5 py-2 text-xs font-medium text-ink-muted text-left whitespace-nowrap';
const td = 'px-3 first:pl-5 last:pr-5 py-2.5 whitespace-nowrap tabular-nums';

/** The two periods side by side, row by row. Clicking a period row drills the page into that day or month. */
export function AlignedTable({
    a,
    b,
    onDrill,
}: {
    a: ReportSeriesPoint[];
    b: ReportSeriesPoint[];
    onDrill: (key: string) => void;
}) {
    const byMonth = (a[0]?.key.length ?? 10) === 7;
    const n = Math.max(a.length, b.length);
    const rows = Array.from({ length: n }, (_, i) => ({ i, a: a[i], b: b[i] }));
    // Newest first, the way the owner scans for "how did yesterday go".
    rows.reverse();

    return (
        <Panel
            title={byMonth ? 'Month by month' : 'Day by day'}
            description={`Select a ${byMonth ? 'month' : 'day'} to see it on its own`}
        >
            <div className="overflow-x-auto pb-1.5">
                <table className="w-full text-[13px]">
                    <thead className="border-y border-line bg-canvas/50">
                        <tr>
                            <th className={th}>
                                <span className="inline-flex items-center gap-1.5">
                                    <Swatch which="a" />{' '}
                                    {byMonth ? 'Month' : 'Day'}
                                </span>
                            </th>
                            <th className={cn(th, 'text-right')}>Bills</th>
                            <th className={cn(th, 'text-right')}>Revenue</th>
                            <th className={th}>
                                <span className="inline-flex items-center gap-1.5">
                                    <Swatch which="b" /> Compared with
                                </span>
                            </th>
                            <th className={cn(th, 'text-right')}>Bills</th>
                            <th className={cn(th, 'text-right')}>Revenue</th>
                            <th className={cn(th, 'text-right')}>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ i, a: pa, b: pb }) => (
                            <tr
                                key={i}
                                onClick={() => pa && onDrill(pa.key)}
                                className={cn(
                                    'group border-b border-line/70 last:border-0',
                                    pa && 'cursor-pointer hover:bg-canvas/50',
                                )}
                            >
                                <td className={td}>
                                    {pa ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDrill(pa.key);
                                            }}
                                            className="inline-flex items-center gap-1 rounded font-medium text-ink group-hover:text-brand-600"
                                        >
                                            {formatKey(pa.key, !byMonth)}
                                            <ChevronRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </button>
                                    ) : (
                                        <span className="text-ink-muted">
                                            —
                                        </span>
                                    )}
                                </td>
                                <td
                                    className={cn(
                                        td,
                                        'text-right text-ink-muted',
                                    )}
                                >
                                    {pa ? pa.bills : ''}
                                </td>
                                <td
                                    className={cn(
                                        td,
                                        'text-right font-semibold text-ink',
                                    )}
                                >
                                    {pa ? formatCurrency(pa.revenue) : ''}
                                </td>
                                <td className={cn(td, 'text-ink-muted')}>
                                    {pb ? formatKey(pb.key, !byMonth) : '—'}
                                </td>
                                <td
                                    className={cn(
                                        td,
                                        'text-right text-ink-muted',
                                    )}
                                >
                                    {pb ? pb.bills : ''}
                                </td>
                                <td
                                    className={cn(
                                        td,
                                        'text-right text-ink-muted',
                                    )}
                                >
                                    {pb ? formatCurrency(pb.revenue) : ''}
                                </td>
                                <td className={cn(td, 'text-right')}>
                                    {pa && pb ? (
                                        pa.revenue === 0 ? (
                                            <span className="text-[11px] text-ink-muted">
                                                No sales
                                            </span>
                                        ) : (
                                            <DeltaChip
                                                a={pa.revenue}
                                                b={pb.revenue}
                                                size="sm"
                                            />
                                        )
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}
