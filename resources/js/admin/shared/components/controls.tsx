import { forwardRef } from 'react';
import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
} from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    Loader2,
    Minus,
    Search,
    X,
} from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';
import { percentChange } from '@admin/shared/utils/format';

/** Compact admin select (32px, 8px radius), matching the secondary button. */
export function MiniSelect<T extends string>({
    value,
    onChange,
    options,
    className,
    ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
}) {
    return (
        <div className={cn('relative', className)}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-line bg-canvas-card pr-8 pl-2.5 text-[13px] font-medium text-ink shadow-soft transition-colors hover:border-ink-subtle"
                {...props}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ink-muted" />
        </div>
    );
}

/**
 * Native date input (keyboard entry + the OS picker) with the browser's own chrome replaced: a muted
 * placeholder instead of "yyyy-mm-dd", and a themed calendar icon over the invisible picker button.
 */
export function DateField({
    invalid,
    className,
    placeholder = 'Any date',
    value,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
    const empty = !value;
    return (
        <div className={cn('group relative w-36', className)}>
            <input
                type="date"
                value={value}
                className={cn(
                    'peer h-8 w-full rounded-lg border bg-canvas-card pr-8 pl-2.5 text-[13px] font-medium text-ink tabular-nums shadow-soft transition-colors hover:border-ink-subtle',
                    '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-1.5 [&::-webkit-calendar-picker-indicator]:size-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
                    empty &&
                        '[&:not(:focus)::-webkit-datetime-edit]:text-transparent',
                    invalid ? 'border-danger-text/60' : 'border-line',
                )}
                {...props}
            />
            {empty && (
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] text-ink-muted peer-focus:hidden">
                    {placeholder}
                </span>
            )}
            <Calendar className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ink-muted" />
        </div>
    );
}

/** Segmented control: a group of toggle buttons with one pressed. */
export function Segmented<T extends string>({
    value,
    onChange,
    options,
    label,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: ReactNode }[];
    label: string;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            className="inline-flex rounded-lg border border-line bg-canvas p-0.5"
        >
            {options.map((o) => {
                const on = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(o.value)}
                        className={cn(
                            'h-6 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors',
                            on
                                ? 'bg-canvas-card text-ink shadow-soft ring-1 ring-line'
                                : 'text-ink-muted hover:text-ink',
                        )}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Period identity swatch: A is solid blue, B is mist, everywhere on the page. */
export function Swatch({
    which,
    className,
}: {
    which: 'a' | 'b';
    className?: string;
}) {
    return (
        <span
            aria-hidden
            className={cn(
                'inline-block size-2.5 shrink-0 rounded-[3px]',
                which === 'a' ? 'bg-brand-500' : 'bg-brand-200',
                className,
            )}
        />
    );
}

/**
 * Signed change of A against B. Arrow + sign carry direction; colour follows whether up is good
 * (`tone="neutral"` for measures like credit sales where more isn't simply better).
 */
export function DeltaChip({
    a,
    b,
    tone = 'up-good',
    size = 'md',
}: {
    a: number;
    b: number;
    tone?: 'up-good' | 'neutral';
    size?: 'sm' | 'md';
}) {
    const pct = percentChange(a, b);
    if (pct === null) {
        return (
            <span
                className={cn(
                    'text-ink-muted',
                    size === 'sm' ? 'text-[11px]' : 'text-xs',
                )}
            >
                {a > 0 ? 'New' : '—'}
            </span>
        );
    }
    const flat = Math.abs(pct) < 0.5;
    const up = pct > 0;
    const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
    const color =
        flat || tone === 'neutral'
            ? 'bg-canvas text-ink-muted'
            : up
              ? 'bg-success-bg text-success-text'
              : 'bg-danger-bg text-danger-text';
    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-md font-semibold whitespace-nowrap tabular-nums',
                size === 'sm' ? 'px-1 text-[11px]' : 'px-1.5 py-px text-xs',
                color,
            )}
        >
            <Icon className="size-3" strokeWidth={2.5} />
            {flat
                ? '0%'
                : `${up ? '+' : '−'}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`}
        </span>
    );
}

export type CompactButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const COMPACT_VARIANTS: Record<CompactButtonVariant, string> = {
    primary:
        'bg-brand-500 text-white border-brand-500 hover:bg-brand-600 hover:border-brand-600 shadow-soft',
    secondary:
        'bg-canvas-card text-ink border-line hover:border-ink-subtle shadow-soft',
    danger: 'bg-canvas-card text-danger-text border-line hover:bg-danger-bg hover:border-danger-bg shadow-soft',
    ghost: 'bg-transparent text-ink-muted border-transparent hover:text-ink hover:bg-ink/[0.04]',
};

/**
 * The admin's 32px button (DESIGN.md "Buttons"). The shared `Button` keeps POS's 44px touch sizing,
 * so admin surfaces use this instead of overriding it at every call site.
 */
export const CompactButton = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: CompactButtonVariant;
        busy?: boolean;
    }
>(function CompactButton(
    { variant = 'secondary', busy, disabled, className, children, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type="button"
            disabled={disabled || busy}
            className={cn(
                'inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-3.5',
                COMPACT_VARIANTS[variant],
                className,
            )}
            {...props}
        >
            {busy && <Loader2 className="animate-spin" />}
            {children}
        </button>
    );
});

/** 32px search field with a clear button. */
export function SearchField({
    value,
    onChange,
    placeholder,
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    className?: string;
}) {
    return (
        <div className={cn('relative', className)}>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted" />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-8 w-full rounded-lg border border-line bg-canvas-card pr-8 pl-8 text-[13px] text-ink shadow-soft transition-colors placeholder:text-ink-muted hover:border-ink-subtle [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-ink-muted hover:text-ink"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    );
}

/** 32px text/number input in the admin's compact style. */
export const CompactInput = forwardRef<
    HTMLInputElement,
    InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function CompactInput({ invalid, className, ...props }, ref) {
    return (
        <input
            ref={ref}
            className={cn(
                'h-8 rounded-lg border bg-canvas-card px-2.5 text-[13px] text-ink tabular-nums shadow-soft transition-colors placeholder:text-ink-muted hover:border-ink-subtle',
                invalid ? 'border-danger-text/60' : 'border-line',
                className,
            )}
            {...props}
        />
    );
});

/** On/off switch (role="switch"); the label sits beside it in the caller's layout. */
export function Switch({
    checked,
    onChange,
    label,
    disabled,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-brand-500' : 'bg-ink-muted/80',
            )}
        >
            <span
                className={cn(
                    'inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
                    checked ? 'translate-x-[18px]' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}
