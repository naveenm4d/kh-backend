import type { ReactNode } from 'react';

export interface SidebarProps {
    header: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
}

export function Sidebar({ header, children, footer }: SidebarProps) {
    return (
        <div className="flex w-[240px] shrink-0 flex-col border-r border-line bg-canvas px-3 pt-4 pb-3">
            <div className="px-1.5 pb-5">{header}</div>
            <nav className="flex min-h-0 flex-col gap-5 overflow-y-auto">
                {children}
            </nav>
            <div className="flex-1" />
            {footer}
        </div>
    );
}
