import type { ReactNode } from 'react';

/** Page header, toolbar, then the list (left, flexible) beside the detail panel (right, fixed). */
export function RecordsLayout({
    title,
    subtitle,
    actions,
    toolbar,
    list,
    panel,
}: {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    toolbar?: ReactNode;
    list: ReactNode;
    panel: ReactNode;
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-end justify-between gap-6 px-8 pt-7 pb-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-1 text-[13px] text-ink-muted tabular-nums">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex shrink-0 items-center gap-2">
                        {actions}
                    </div>
                )}
            </header>
            {toolbar && (
                <div className="flex flex-wrap items-center gap-2 px-8 pb-4">
                    {toolbar}
                </div>
            )}
            <div className="flex min-h-0 flex-1 gap-4 px-8 pb-6">
                <div className="flex min-w-0 flex-1 flex-col">{list}</div>
                <aside className="flex min-h-0 w-[340px] shrink-0 flex-col xl:w-[400px] 2xl:w-[440px]">
                    {panel}
                </aside>
            </div>
        </div>
    );
}
