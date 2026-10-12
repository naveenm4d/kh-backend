import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'ghost'
    | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary:
        'bg-brand-500 text-white hover:bg-brand-600 active:scale-[0.98] disabled:bg-brand-300',
    secondary:
        'bg-white text-ink border border-line hover:bg-canvas disabled:text-ink-subtle',
    outline:
        'bg-transparent text-brand-600 border border-dashed border-line hover:bg-brand-50',
    danger: 'bg-white text-danger-text border border-danger-bg hover:bg-danger-bg disabled:text-ink-subtle',
    ghost: 'bg-transparent text-ink hover:bg-canvas disabled:text-ink-subtle',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-11 px-4 text-sm gap-2',
    lg: 'h-14 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading,
            disabled,
            children,
            ...props
        },
        ref,
    ) {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold transition-all disabled:cursor-not-allowed',
                    VARIANT_CLASSES[variant],
                    SIZE_CLASSES[size],
                    className,
                )}
                {...props}
            >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {children}
            </button>
        );
    },
);
