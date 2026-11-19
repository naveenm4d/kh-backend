import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@admin/shared/components/Modal';
import { cn } from '@admin/shared/lib/cn';

export interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    headerActions?: ReactNode;
    className?: string;
}

export function Dialog({
    open,
    onClose,
    title,
    children,
    footer,
    headerActions,
    className,
}: DialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            className={cn('flex flex-col', className)}
        >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="text-lg font-extrabold text-ink">{title}</div>
                <div className="flex items-center gap-2">
                    {headerActions}
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1 text-ink-muted hover:bg-canvas hover:text-ink"
                        aria-label="Close"
                    >
                        <X className="size-5" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
                <div className="border-t border-line px-5 py-4">{footer}</div>
            )}
        </Modal>
    );
}
