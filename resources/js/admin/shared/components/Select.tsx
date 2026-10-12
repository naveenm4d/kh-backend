import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@admin/shared/lib/cn';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    function Select({ className, label, error, options, id, ...props }, ref) {
        return (
            <label className="flex w-full flex-col gap-1.5" htmlFor={id}>
                {label && (
                    <span className="text-xs font-semibold text-ink-muted">
                        {label}
                    </span>
                )}
                <select
                    ref={ref}
                    id={id}
                    className={cn(
                        'h-11 rounded-xl border border-line bg-canvas/40 px-3 text-sm font-medium text-ink transition-colors outline-none',
                        'focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100',
                        error && 'border-danger-text/50',
                        className,
                    )}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <span className="text-xs font-medium text-danger-text">
                        {error}
                    </span>
                )}
            </label>
        );
    },
);
