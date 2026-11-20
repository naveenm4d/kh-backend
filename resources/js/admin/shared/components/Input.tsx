import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@admin/shared/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
    leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { className, error, label, leftIcon, id, ...props },
    ref,
) {
    return (
        <label className="flex w-full flex-col gap-1.5" htmlFor={id}>
            {label && (
                <span className="text-xs font-semibold text-ink-muted">
                    {label}
                </span>
            )}
            <div className="relative">
                {leftIcon && (
                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-subtle">
                        {leftIcon}
                    </span>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={cn(
                        'h-11 w-full rounded-xl border border-line bg-canvas/40 px-3.5 text-sm font-medium text-ink transition-colors outline-none',
                        'focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100',
                        'disabled:opacity-60',
                        leftIcon && 'pl-10',
                        error &&
                            'border-danger-text/50 focus:border-danger-text focus:ring-danger-bg',
                        className,
                    )}
                    {...props}
                />
            </div>
            {error && (
                <span className="text-xs font-medium text-danger-text">
                    {error}
                </span>
            )}
        </label>
    );
});
