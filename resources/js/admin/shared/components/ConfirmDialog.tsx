import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { Modal } from '@admin/shared/components/Modal';
import { Button } from '@admin/shared/components/Button';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

    const confirm = useCallback<ConfirmFn>((opts) => {
        setOptions(opts);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const close = useCallback((result: boolean) => {
        resolver.current?.(result);
        setOptions(null);
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                open={!!options}
                onClose={() => close(false)}
                className="flex flex-col gap-3.5 p-6"
            >
                <div className="text-[17px] font-extrabold text-ink">
                    {options?.title}
                </div>
                {options?.description && (
                    <div className="text-sm text-ink-muted">
                        {options.description}
                    </div>
                )}
                <div className="mt-1.5 flex gap-2.5">
                    <Button
                        variant={options?.danger ? 'danger' : 'primary'}
                        className={
                            options?.danger
                                ? 'flex-1 !border-red-600 !bg-red-600 !text-white hover:!bg-red-700'
                                : 'flex-1'
                        }
                        onClick={() => close(true)}
                    >
                        {options?.confirmLabel ?? 'Confirm'}
                    </Button>
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => close(false)}
                    >
                        {options?.cancelLabel ?? 'Close'}
                    </Button>
                </div>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx)
        throw new Error('useConfirm must be used within a ConfirmProvider');
    return ctx;
}
