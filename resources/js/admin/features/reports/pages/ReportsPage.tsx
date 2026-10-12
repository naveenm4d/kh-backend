import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@admin/shared/components/Button';
import { cn } from '@admin/shared/lib/cn';
import { useReportSummary } from '@admin/features/reports/hooks';
import { PeriodBar } from '@admin/features/reports/components/PeriodBar';
import type { PeriodState } from '@admin/features/reports/components/PeriodBar';
import { ComparisonStrip } from '@admin/features/reports/components/ComparisonStrip';
import { RaceChart } from '@admin/features/reports/components/RaceChart';
import { BreakdownPanel } from '@admin/features/reports/components/BreakdownPanel';
import { AlignedTable } from '@admin/features/reports/components/AlignedTable';
import { DayBills } from '@admin/features/reports/components/DayBills';
import {
    granularityFor,
    iso,
    isValidRange,
    parse,
    resolveCompare,
    resolvePreset,
} from '@admin/features/reports/periods';
import type { ReportQuery } from '@admin/features/reports/types';

function initialState(today: Date): PeriodState {
    const t = iso(today);
    const monthStart = iso(new Date(today.getFullYear(), today.getMonth(), 1));
    return {
        preset: 'this-month',
        day: t,
        custom: { from: monthStart, to: t },
        compare: 'previous',
        compareCustom: { from: monthStart, to: t },
    };
}

export function ReportsPage() {
    const today = useMemo(() => new Date(), []);
    const [state, setState] = useState<PeriodState>(() => initialState(today));
    const update = (patch: Partial<PeriodState>) =>
        setState((s) => ({ ...s, ...patch }));

    const rangeA = resolvePreset(state.preset, today, state.custom, state.day);
    const validA = isValidRange(rangeA);
    const rangeB = validA
        ? resolveCompare(
              state.compare,
              rangeA,
              state.preset,
              state.compareCustom,
          )
        : null;
    const validB = !!rangeB && isValidRange(rangeB);
    // Both periods share A's bucket size so they line up position by position.
    const granularity = validA ? granularityFor(rangeA) : 'day';
    const qa: ReportQuery | null = validA ? { ...rangeA, granularity } : null;
    const qb: ReportQuery | null =
        validB && rangeB ? { ...rangeB, granularity } : null;

    const A = useReportSummary(qa);
    const B = useReportSummary(qb);
    const singleDay = validA && rangeA.from === rangeA.to;
    const fetching = A.isFetching || B.isFetching;
    const error = A.error ?? B.error;

    const drill = (key: string) => {
        if (key.length === 10) {
            update({ preset: 'day', day: key });
        } else {
            const start = parse(`${key}-01`);
            update({
                preset: 'custom',
                custom: {
                    from: `${key}-01`,
                    to: iso(
                        new Date(start.getFullYear(), start.getMonth() + 1, 0),
                    ),
                },
            });
        }
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-end justify-between gap-6 px-8 pt-7 pb-5">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">
                        Reports
                    </h1>
                    <p className="mt-1 text-[13px] text-ink-muted">
                        Compare any period with another: a day, a week, a month
                        or a year.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        void A.refetch();
                        void B.refetch();
                    }}
                    disabled={fetching || !qa}
                    className="h-8 shrink-0 rounded-lg shadow-soft"
                >
                    <RefreshCw
                        className={cn('size-3.5', fetching && 'animate-spin')}
                    />
                    Refresh
                </Button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-10">
                <div className="flex max-w-[1440px] flex-col gap-4">
                    <PeriodBar
                        state={state}
                        onChange={update}
                        a={rangeA}
                        b={rangeB}
                    />

                    {!qa || !qb ? (
                        <div className="py-16 text-center text-[13px] text-ink-muted">
                            Fix the dates above to see the report.
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                            <AlertCircle className="mb-1 size-7 text-danger-text" />
                            <div className="text-sm font-semibold text-ink">
                                Couldn't load this report
                            </div>
                            <div className="max-w-sm text-[13px] text-ink-muted">
                                {(error as { message?: string }).message ||
                                    'Something went wrong while reading sales data.'}
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="mt-3 rounded-lg"
                                onClick={() => (A.refetch(), B.refetch())}
                            >
                                Try again
                            </Button>
                        </div>
                    ) : !A.data || !B.data ? (
                        <ReportSkeleton />
                    ) : (
                        <div
                            className={cn(
                                'flex flex-col gap-4 transition-opacity',
                                (A.isPlaceholderData || B.isPlaceholderData) &&
                                    'opacity-60',
                            )}
                        >
                            <ComparisonStrip
                                a={A.data.totals}
                                b={B.data.totals}
                                rangeB={rangeB!}
                            />

                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                                <div className="flex min-w-0 flex-col xl:col-span-2 [&>*]:flex-1">
                                    {singleDay ? (
                                        <DayBills date={rangeA.from} />
                                    ) : (
                                        <RaceChart
                                            a={A.data.series}
                                            b={B.data.series}
                                            rangeA={rangeA}
                                            rangeB={rangeB!}
                                            today={iso(today)}
                                        />
                                    )}
                                </div>
                                <BreakdownPanel
                                    a={A.data}
                                    b={B.data}
                                    rangeB={rangeB!}
                                />
                            </div>

                            {!singleDay &&
                                (A.data.totals.bills > 0 ||
                                    B.data.totals.bills > 0) && (
                                    <AlignedTable
                                        a={A.data.series}
                                        b={B.data.series}
                                        onDrill={drill}
                                    />
                                )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Bone({
    className,
    style,
}: {
    className?: string;
    style?: CSSProperties;
}) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-line/60', className)}
            style={style}
        />
    );
}

function ReportSkeleton() {
    return (
        <div
            className="flex flex-col gap-4"
            aria-busy="true"
            aria-label="Loading report"
        >
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex flex-col gap-3 bg-canvas-card px-5 py-4"
                    >
                        <Bone className="h-3.5 w-24" />
                        <Bone className="h-7 w-36" />
                        <Bone className="h-3.5 w-28" />
                    </div>
                ))}
            </div>
            <div
                className="grid grid-cols-1 gap-4 xl:grid-cols-3"
                style={{ minHeight: 400 }}
            >
                <div className="rounded-card border border-line bg-canvas-card p-5 xl:col-span-2">
                    <Bone className="h-4 w-28" />
                    <div className="mt-12 flex h-[240px] items-end gap-2">
                        {[30, 38, 44, 50, 58, 63, 70, 74, 80, 86].map(
                            (h, i) => (
                                <Bone
                                    key={i}
                                    className="flex-1 rounded-b-none"
                                    style={{ height: `${h}%` }}
                                />
                            ),
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-5 rounded-card border border-line bg-canvas-card p-5">
                    <Bone className="h-4 w-36" />
                    {[0, 1, 2, 3].map((i) => (
                        <Bone key={i} className="h-8" />
                    ))}
                </div>
            </div>
        </div>
    );
}
