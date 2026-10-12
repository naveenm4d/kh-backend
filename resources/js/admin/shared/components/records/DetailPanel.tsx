import type { ReactNode } from 'react';
import { ChevronLeft, MousePointerClick, X } from 'lucide-react';
import { Card } from '@admin/shared/components/Card';
import { cn } from '@admin/shared/lib/cn';

/** The right-hand record panel: sticky header (title, meta, actions), scrolling body of sections. */
export function DetailPanel({
    title,
    meta,
    badge,
    actions,
    onClose,
    onBack,
    children,
}: {
    title: ReactNode;
    meta?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    onClose: () => void;
    /** A nested view (e.g. a bill opened from a customer) shows a way back to its parent. */
    onBack?: { label: string; onClick: () => void };
    children: ReactNode;
}) {
    return (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="border-b border-line px-5 pt-4 pb-3.5">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack.onClick}
                        className="mb-2 -ml-1.5 inline-flex max-w-full cursor-pointer items-center gap-0.5 rounded-md px-1 text-[13px] text-ink-muted hover:text-ink"
                    >
                        <ChevronLeft className="size-3.5 shrink-0" />{' '}
                        <span className="truncate">{onBack.label}</span>
                    </button>
                )}
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <h2 className="truncate text-base font-semibold text-ink">
                                {title}
                            </h2>
                            {badge}
                        </div>
                        {meta && (
                            <div className="mt-0.5 truncate text-[13px] text-ink-muted tabular-nums">
                                {meta}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close panel"
                        className="-mt-0.5 -mr-1.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-ink/[0.04] hover:text-ink"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                {actions && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </Card>
    );
}

export function PanelSection({
    title,
    aside,
    children,
    className,
}: {
    title?: string;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'border-b border-line px-5 py-4 last:border-0',
                className,
            )}
        >
            {(title || aside) && (
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                    {title && (
                        <h3 className="text-xs font-medium text-ink-muted">
                            {title}
                        </h3>
                    )}
                    {aside && (
                        <div className="text-xs text-ink-muted tabular-nums">
                            {aside}
                        </div>
                    )}
                </div>
            )}
            {children}
        </section>
    );
}

/** Two or three key figures in a hairline-divided row, the panel's version of the stat strip. */
export function PanelFigures({
    items,
}: {
    items: { label: string; value: ReactNode; tone?: 'warning' | 'danger' }[];
}) {
    return (
        <div
            className={cn(
                'grid gap-px border-b border-line bg-line',
                items.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
            )}
        >
            {items.map((f) => (
                <div
                    key={f.label}
                    className="min-w-0 bg-canvas-card px-4 py-3.5 first:pl-5 last:pr-5"
                >
                    <div className="text-xs text-ink-muted">{f.label}</div>
                    <div
                        className={cn(
                            'mt-1 text-[15px] leading-6 font-semibold whitespace-nowrap tabular-nums',
                            f.tone === 'warning'
                                ? 'text-warning-text'
                                : f.tone === 'danger'
                                  ? 'text-danger-text'
                                  : 'text-ink',
                        )}
                    >
                        {f.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Definition rows: label left, value right. */
export function PanelFacts({
    rows,
}: {
    rows: { label: string; value: ReactNode }[];
}) {
    return (
        <dl className="flex flex-col gap-2 text-[13px]">
            {rows.map((r) => (
                <div
                    key={r.label}
                    className="flex items-baseline justify-between gap-4"
                >
                    <dt className="shrink-0 text-ink-muted">{r.label}</dt>
                    <dd className="min-w-0 truncate text-right text-ink tabular-nums">
                        {r.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function NoSelection({ noun, hint }: { noun: string; hint?: string }) {
    return (
        <Card className="flex flex-1 flex-col items-center justify-center gap-1 px-8 text-center">
            <MousePointerClick className="mb-1.5 size-6 text-ink-subtle" />
            <div className="text-[13px] font-medium text-ink">
                Select {noun} to see details
            </div>
            <div className="max-w-[30ch] text-[13px] text-ink-muted">
                {hint ??
                    'Click a row, or focus the list and use the ↑ and ↓ keys.'}
            </div>
        </Card>
    );
}
