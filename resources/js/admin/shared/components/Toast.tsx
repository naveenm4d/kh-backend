import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
}

interface ToastContextValue {
    show: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<
    ToastKind,
    { icon: typeof CheckCircle2; className: string }
> = {
    success: {
        icon: CheckCircle2,
        className: 'bg-success-bg text-success-text',
    },
    error: { icon: XCircle, className: 'bg-danger-bg text-danger-text' },
    info: { icon: Info, className: 'bg-brand-50 text-brand-700' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setItems((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const show = useCallback(
        (kind: ToastKind, message: string) => {
            const id = Date.now() + Math.random();
            setItems((prev) => [...prev, { id, kind, message }]);
            setTimeout(() => dismiss(id), 4000);
        },
        [dismiss],
    );

    const value = useMemo(() => ({ show }), [show]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {createPortal(
                <div className="fixed right-5 bottom-5 z-[100] flex w-80 flex-col gap-2">
                    {items.map((item) => {
                        const { icon: Icon, className } =
                            KIND_STYLES[item.kind];
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    'flex animate-fadeScaleIn items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-pop',
                                    className,
                                )}
                            >
                                <Icon className="mt-0.5 size-4.5 shrink-0" />
                                <span className="flex-1">{item.message}</span>
                                <button
                                    onClick={() => dismiss(item.id)}
                                    className="cursor-pointer opacity-60 hover:opacity-100"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>,
                document.body,
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return {
        success: (message: string) => ctx.show('success', message),
        error: (message: string) => ctx.show('error', message),
        info: (message: string) => ctx.show('info', message),
    };
}
