import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@admin/shared/lib/cn';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    overlayClassName?: string;
}

/** Open modals, oldest first — Escape closes only the topmost one, so stacked windows peel off one at a time. */
const openStack: number[] = [];
let nextId = 0;

export function Modal({
    open,
    onClose,
    children,
    className,
    overlayClassName,
}: ModalProps) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        const id = ++nextId;
        openStack.push(id);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && openStack[openStack.length - 1] === id)
                onCloseRef.current();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            openStack.splice(openStack.indexOf(id), 1);
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-40 flex animate-fadeIn items-center justify-center bg-black/45 p-4',
                overlayClassName,
            )}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={cn(
                    'max-h-[90vh] w-full max-w-md animate-fadeScaleIn overflow-y-auto rounded-2xl bg-white shadow-pop',
                    className,
                )}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
