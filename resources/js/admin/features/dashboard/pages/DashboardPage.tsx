import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@admin/shared/components/Button';
import { cn } from '@admin/shared/lib/cn';
import { useCurrentUser } from '@admin/features/auth/hooks';
import { useDashboardSummary } from '@admin/features/dashboard/hooks';
import { StatStrip } from '@admin/features/dashboard/components/StatStrip';
import { SalesTrendChart } from '@admin/features/dashboard/components/SalesTrendChart';
import { CreditList } from '@admin/features/dashboard/components/CreditList';
import { RecentBills } from '@admin/features/dashboard/components/RecentBills';
import { LowStockList } from '@admin/features/dashboard/components/LowStockList';
import { TopProductsTable } from '@admin/features/dashboard/components/TopProductsTable';
import { CategoryBreakdown } from '@admin/features/dashboard/components/CategoryBreakdown';

function greeting(hour: number) {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

/** "just now" / "3 min ago" / "14:05", re-rendered every 30s so it doesn't go stale on screen. */
function useUpdatedLabel(updatedAt: number) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(id);
    }, []);
    if (!updatedAt) return null;
    const mins = Math.floor((now - updatedAt) / 60_000);
    if (mins < 1) return 'Updated just now';
    if (mins < 60) return `Updated ${mins} min ago`;
    return `Updated ${new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function DashboardPage() {
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        dataUpdatedAt,
    } = useDashboardSummary();
    const user = useCurrentUser();
    const updatedLabel = useUpdatedLabel(dataUpdatedAt);
    const now = new Date();
    const dateLabel = now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const firstName = user?.name.split(' ')[0];
    // The trend window always ends on the backend's today; use it so "Today" labels agree with the figures.
    const todayIso = data?.dailyTrend.at(-1)?.date ?? '';

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-end justify-between gap-6 px-8 pt-7 pb-5">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-[13px] text-ink-muted">
                        {greeting(now.getHours())}
                        {firstName ? `, ${firstName}` : ''} · {dateLabel}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {updatedLabel && (
                        <span className="text-[13px] text-ink-muted tabular-nums">
                            {updatedLabel}
                        </span>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="h-8 rounded-lg shadow-soft"
                    >
                        <RefreshCw
                            className={cn(
                                'size-3.5',
                                isFetching && 'animate-spin',
                            )}
                        />
                        Refresh
                    </Button>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-10">
                {isLoading ? (
                    <DashboardSkeleton />
                ) : isError || !data ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                        <AlertCircle className="mb-1 size-7 text-danger-text" />
                        <div className="text-sm font-semibold text-ink">
                            Couldn't load the dashboard
                        </div>
                        <div className="max-w-sm text-[13px] text-ink-muted">
                            {(error as { message?: string } | null)?.message ||
                                'Something went wrong while reading sales data.'}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3 rounded-lg"
                            onClick={() => refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : (
                    <div className="flex max-w-[1440px] flex-col gap-4">
                        <StatStrip data={data} />

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="flex min-w-0 flex-col xl:col-span-2 [&>*]:flex-1">
                                <SalesTrendChart data={data.dailyTrend} />
                            </div>
                            <CreditList
                                data={data.topDebtors}
                                total={data.outstandingCredit}
                                count={data.customersWithBalance}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="flex min-w-0 flex-col xl:col-span-2 [&>*]:flex-1">
                                <RecentBills
                                    data={data.recentOrders}
                                    todayIso={todayIso}
                                />
                            </div>
                            <LowStockList
                                data={data.lowStockItems}
                                count={data.lowStockCount}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="flex min-w-0 flex-col xl:col-span-2 [&>*]:flex-1">
                                <TopProductsTable data={data.topProducts} />
                            </div>
                            <CategoryBreakdown data={data.categoryBreakdown} />
                        </div>
                    </div>
                )}
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

/** Mirrors the loaded layout so nothing jumps when data lands. */
function DashboardSkeleton() {
    return (
        <div
            className="flex max-w-[1440px] flex-col gap-4"
            aria-busy="true"
            aria-label="Loading dashboard"
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
            {[
                [7, 6, 360],
                [7, 7, 370],
                [7, 7, 380],
            ].map(([left, right, minHeight], row) => (
                <div
                    key={row}
                    className="grid grid-cols-1 gap-4 xl:grid-cols-3"
                    style={{ minHeight }}
                >
                    <SkeletonPanel
                        rows={left}
                        className="xl:col-span-2"
                        chart={row === 0}
                    />
                    <SkeletonPanel rows={right} />
                </div>
            ))}
        </div>
    );
}

function SkeletonPanel({
    rows,
    className,
    chart,
}: {
    rows: number;
    className?: string;
    chart?: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-card border border-line bg-canvas-card px-5 pt-4 pb-5',
                className,
            )}
        >
            <Bone className="h-4 w-28" />
            <Bone className="mt-2 h-3.5 w-40" />
            {chart ? (
                <div className="mt-5 flex h-[232px] items-end gap-3">
                    {[
                        45, 60, 52, 20, 75, 68, 55, 40, 82, 62, 70, 20, 88, 30,
                    ].map((h, i) => (
                        <Bone
                            key={i}
                            className="flex-1 rounded-b-none"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>
            ) : (
                <div className="mt-5 flex flex-col gap-4">
                    {Array.from({ length: rows }, (_, i) => (
                        <Bone
                            key={i}
                            className="h-4"
                            style={{ width: `${92 - ((i * 13) % 30)}%` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
