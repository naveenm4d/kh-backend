import type { ReactNode } from 'react';
import { Link } from '@admin/shared/lib/router';
import { ChevronRight } from 'lucide-react';
import { Card } from '@admin/shared/components/Card';
import { cn } from '@admin/shared/lib/cn';

export interface PanelProps {
    title: string;
    description?: ReactNode;
    action?: { label: string; to: string };
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}

/** A titled dashboard section: header row (title, context, optional link) over a body. */
export function Panel({
    title,
    description,
    action,
    children,
    className,
    bodyClassName,
}: PanelProps) {
    return (
        <Card className={cn('flex min-w-0 flex-col', className)}>
            <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-ink">{title}</h2>
                    {description && (
                        <div className="mt-0.5 text-[13px] text-ink-muted tabular-nums">
                            {description}
                        </div>
                    )}
                </div>
                {action && (
                    <Link
                        to={action.to}
                        className="-mr-1 inline-flex shrink-0 items-center gap-0.5 rounded px-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-brand-600"
                    >
                        {action.label}
                        <ChevronRight className="size-3.5" />
                    </Link>
                )}
            </div>
            <div className={cn('min-h-0 flex-1', bodyClassName)}>
                {children}
            </div>
        </Card>
    );
}

/** Footer link to the full list when a panel shows only the top N. */
export function PanelMore({ to, total }: { to: string; total: number }) {
    return (
        <Link
            to={to}
            className="inline-flex items-center gap-0.5 rounded text-[13px] font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
            View all {total}
            <ChevronRight className="size-3.5" />
        </Link>
    );
}

/** Quiet in-panel empty message, sized to sit inside a list area rather than take over the page. */
export function PanelEmpty({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description?: string;
}) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-6 py-10 text-center">
            <div className="mb-1.5 text-ink-subtle">{icon}</div>
            <div className="text-[13px] font-medium text-ink">{title}</div>
            {description && (
                <div className="max-w-[34ch] text-[13px] text-ink-muted">
                    {description}
                </div>
            )}
        </div>
    );
}
