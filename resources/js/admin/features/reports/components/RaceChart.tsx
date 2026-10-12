import { useLayoutEffect, useRef, useState } from 'react';
import { LineChart } from 'lucide-react';
import { Panel, PanelEmpty } from '@admin/shared/components/Panel';
import { formatCurrency } from '@admin/shared/utils/currency';
import { compactRupees, niceScale } from '@admin/shared/utils/format';
import { cn } from '@admin/shared/lib/cn';
import { Segmented, Swatch } from '@admin/shared/components/controls';
import { formatKey, formatRange } from '@admin/features/reports/periods';
import type { DateRange } from '@admin/features/reports/periods';
import type { ReportSeriesPoint } from '@admin/features/reports/types';

type Mode = 'running' | 'per';

const MIN_H = 240;
const MAX_H = 340;
const PAD_TOP = 12;
const TICKS = 4;
const A_COLOR = 'rgb(var(--c-brand-500))';
const B_COLOR = 'rgb(var(--c-brand-200))';

function useSize<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) =>
            setSize({
                w: entry.contentRect.width,
                h: entry.contentRect.height,
            }),
        );
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, size] as const;
}

/** Column rounded at its data end only (4px, square at the baseline), per DESIGN.md's bar spec. */
function topRoundedBar(x: number, top: number, w: number, base: number) {
    const h = base - top;
    if (h <= 0) return '';
    const r = Math.min(4, w / 2, h);
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
}

function cumulative(points: ReportSeriesPoint[]) {
    let run = 0;
    return points.map((p) => (run += p.revenue));
}

/**
 * A against B aligned by position in their periods (day 1 with day 1, or month 1 with month 1).
 * "Running total" shows whether A is ahead of B at the same point; "Per day/month" shows paired columns.
 */
export function RaceChart({
    a,
    b,
    rangeA,
    rangeB,
    today,
}: {
    a: ReportSeriesPoint[];
    b: ReportSeriesPoint[];
    rangeA: DateRange;
    rangeB: DateRange;
    /** YYYY-MM-DD; when A runs up to today the race is still on, and the axis says so. */
    today: string;
}) {
    const [mode, setMode] = useState<Mode>('running');
    const [active, setActive] = useState<number | null>(null);
    // The plot grows to fill the panel when the breakdown beside it is taller (e.g. 7 categories).
    const [plotRef, { w: W, h: measuredH }] = useSize<HTMLDivElement>();
    const H = Math.min(MAX_H, Math.max(MIN_H, measuredH));

    const byMonth = (a[0]?.key.length ?? 10) === 7;
    const unit = byMonth ? 'month' : 'day';
    const n = Math.max(a.length, b.length, 1);
    const va = mode === 'running' ? cumulative(a) : a.map((p) => p.revenue);
    const vb = mode === 'running' ? cumulative(b) : b.map((p) => p.revenue);
    const { ceiling, step } = niceScale(Math.max(...va, ...vb, 0), TICKS);
    const ticks = Array.from({ length: TICKS + 1 }, (_, i) => i * step);
    const empty = va.every((v) => v === 0) && vb.every((v) => v === 0);

    const plotH = H - PAD_TOP;
    const y = (v: number) => PAD_TOP + plotH - (v / ceiling) * plotH;
    // Running-total points sit on bucket centres so they line up with the per-bucket columns and x labels.
    const slot = W / n;
    const x = (i: number) => slot * i + slot / 2;
    const path = (vals: number[]) =>
        vals
            .map(
                (v, i) =>
                    `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`,
            )
            .join(' ');
    const area = (vals: number[]) =>
        vals.length
            ? `${path(vals)} L${x(vals.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
            : '';

    const labelEvery = Math.max(1, Math.ceil(n / 10));
    const running = rangeA.to === today;
    // Finish line: where A stands against B at A's last point.
    const last = va.length - 1;
    const lead = last >= 0 && last < vb.length ? va[last] - vb[last] : null;
    const barW = Math.max(2, Math.min(12, (slot - 6) / 2));

    return (
        <Panel
            title="Sales race"
            description={
                mode === 'running'
                    ? `Running total, ${unit} by ${unit}`
                    : `Revenue per ${unit}`
            }
            bodyClassName="px-5 pb-4 flex flex-col"
            className="h-full"
        >
            <div className="-mt-1 mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                        <Swatch which="a" /> {formatRange(rangeA)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Swatch which="b" /> {formatRange(rangeB)}
                    </span>
                </div>
                <Segmented
                    label="Chart view"
                    value={mode}
                    onChange={setMode}
                    options={[
                        { value: 'running', label: 'Running total' },
                        {
                            value: 'per',
                            label: byMonth ? 'Per month' : 'Per day',
                        },
                    ]}
                />
            </div>

            {empty ? (
                <div className="min-h-[264px] flex-1">
                    <PanelEmpty
                        icon={<LineChart className="size-6" />}
                        title="No sales in either period"
                        description="Try a different period. Sales appear here once bills are rung up."
                    />
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 gap-3">
                    <div className="relative mb-6 w-9 shrink-0" aria-hidden>
                        {ticks.map((t) => (
                            <div
                                key={t}
                                className="absolute right-0 -translate-y-1/2 text-[11px] text-ink-muted tabular-nums"
                                style={{ top: y(t) }}
                            >
                                {compactRupees(t)}
                            </div>
                        ))}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <div
                            ref={plotRef}
                            className="relative flex-1"
                            style={{ minHeight: MIN_H, maxHeight: MAX_H }}
                            onMouseLeave={() => setActive(null)}
                        >
                            {W > 0 && (
                                <svg
                                    width={W}
                                    height={H}
                                    className="absolute inset-0 block overflow-visible"
                                    role="img"
                                    aria-label={`Sales for ${formatRange(rangeA)} compared with ${formatRange(rangeB)}`}
                                >
                                    {ticks.map((t) => (
                                        <line
                                            key={t}
                                            x1={0}
                                            x2={W}
                                            y1={y(t)}
                                            y2={y(t)}
                                            stroke={
                                                t === 0
                                                    ? 'rgb(var(--c-ink-subtle))'
                                                    : 'rgb(var(--c-line))'
                                            }
                                            strokeOpacity={t === 0 ? 0.6 : 0.7}
                                        />
                                    ))}
                                    {active !== null && (
                                        <rect
                                            x={slot * active}
                                            y={PAD_TOP}
                                            width={slot}
                                            height={plotH}
                                            fill="rgb(var(--c-canvas))"
                                        />
                                    )}

                                    {mode === 'running' ? (
                                        <>
                                            <path
                                                d={area(va)}
                                                fill={A_COLOR}
                                                fillOpacity={0.08}
                                            />
                                            <path
                                                d={path(vb)}
                                                fill="none"
                                                stroke={B_COLOR}
                                                strokeWidth={2}
                                                strokeLinejoin="round"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d={path(va)}
                                                fill="none"
                                                stroke={A_COLOR}
                                                strokeWidth={2}
                                                strokeLinejoin="round"
                                                strokeLinecap="round"
                                            />
                                            {active !== null && (
                                                <>
                                                    <line
                                                        x1={x(active)}
                                                        x2={x(active)}
                                                        y1={PAD_TOP}
                                                        y2={y(0)}
                                                        stroke="rgb(var(--c-ink-subtle))"
                                                        strokeWidth={1}
                                                    />
                                                    {active < vb.length && (
                                                        <circle
                                                            cx={x(active)}
                                                            cy={y(vb[active])}
                                                            r={4}
                                                            fill={B_COLOR}
                                                            stroke="white"
                                                            strokeWidth={2}
                                                        />
                                                    )}
                                                    {active < va.length && (
                                                        <circle
                                                            cx={x(active)}
                                                            cy={y(va[active])}
                                                            r={4}
                                                            fill={A_COLOR}
                                                            stroke="white"
                                                            strokeWidth={2}
                                                        />
                                                    )}
                                                </>
                                            )}
                                            {active === null &&
                                                va.length > 0 && (
                                                    <circle
                                                        cx={x(va.length - 1)}
                                                        cy={y(
                                                            va[va.length - 1],
                                                        )}
                                                        r={4}
                                                        fill={A_COLOR}
                                                        stroke="white"
                                                        strokeWidth={2}
                                                    />
                                                )}
                                        </>
                                    ) : (
                                        Array.from({ length: n }, (_, i) => (
                                            <g key={i}>
                                                {i < va.length && (
                                                    <path
                                                        d={topRoundedBar(
                                                            x(i) - barW - 1,
                                                            y(va[i]),
                                                            barW,
                                                            y(0),
                                                        )}
                                                        fill={A_COLOR}
                                                    />
                                                )}
                                                {i < vb.length && (
                                                    <path
                                                        d={topRoundedBar(
                                                            x(i) + 1,
                                                            y(vb[i]),
                                                            barW,
                                                            y(0),
                                                        )}
                                                        fill={B_COLOR}
                                                    />
                                                )}
                                            </g>
                                        ))
                                    )}

                                    {/* hit targets, wider than the marks */}
                                    {Array.from({ length: n }, (_, i) => (
                                        <rect
                                            key={i}
                                            x={slot * i}
                                            y={0}
                                            width={slot}
                                            height={H}
                                            fill="transparent"
                                            onMouseEnter={() => setActive(i)}
                                        />
                                    ))}
                                </svg>
                            )}

                            {mode === 'running' &&
                                active === null &&
                                lead !== null &&
                                W > 0 && (
                                    <div
                                        // Anchored above whichever line finishes higher: both lines rise into the end point from the lower
                                        // left, so the space above the top line is the only spot guaranteed to cover neither.
                                        className="pointer-events-none absolute -mt-2.5 -ml-1 -translate-x-full -translate-y-full rounded-md border border-line bg-canvas-card px-2 py-1 text-xs whitespace-nowrap tabular-nums shadow-soft"
                                        style={{
                                            left: x(last),
                                            top: y(
                                                Math.max(va[last], vb[last]),
                                            ),
                                        }}
                                    >
                                        <span className="font-semibold text-ink">
                                            {formatCurrency(Math.abs(lead))}
                                        </span>
                                        <span className="text-ink-muted">
                                            {' '}
                                            {lead >= 0 ? 'ahead' : 'behind'}
                                            {running ? ' so far' : ''}
                                        </span>
                                    </div>
                                )}
                            {active !== null && (
                                <div
                                    className={cn(
                                        'pointer-events-none absolute top-0 z-10 rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white tabular-nums shadow-lg',
                                        x(active) > W * 0.6
                                            ? '-translate-x-[calc(100%+12px)]'
                                            : 'translate-x-3',
                                    )}
                                    style={{ left: x(active) }}
                                >
                                    <div className="mb-1 text-[11px] text-white/60">
                                        {mode === 'running'
                                            ? `Up to ${unit} ${active + 1}`
                                            : `${byMonth ? 'Month' : 'Day'} ${active + 1}`}
                                    </div>
                                    {[
                                        {
                                            which: 'a' as const,
                                            p: a[active],
                                            v: va[active],
                                        },
                                        {
                                            which: 'b' as const,
                                            p: b[active],
                                            v: vb[active],
                                        },
                                    ].map(({ which, p, v }) => (
                                        <div
                                            key={which}
                                            className="flex items-center gap-2"
                                        >
                                            <Swatch which={which} />
                                            <span className="w-16 text-white/70">
                                                {p
                                                    ? formatKey(p.key, !byMonth)
                                                    : '—'}
                                            </span>
                                            <span className="ml-auto font-semibold">
                                                {p ? formatCurrency(v) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative h-6" aria-hidden>
                            {a.map((p, i) =>
                                i % labelEvery === 0 || i === a.length - 1 ? (
                                    <span
                                        key={p.key}
                                        className="absolute top-1.5 -translate-x-1/2 text-[11px] whitespace-nowrap text-ink-muted tabular-nums"
                                        style={{ left: x(i) }}
                                    >
                                        {!byMonth && p.key === today ? (
                                            <span className="font-medium text-ink">
                                                Today
                                            </span>
                                        ) : byMonth ? (
                                            formatKey(p.key).slice(0, 3)
                                        ) : (
                                            formatKey(p.key)
                                        )}
                                    </span>
                                ) : null,
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Panel>
    );
}
