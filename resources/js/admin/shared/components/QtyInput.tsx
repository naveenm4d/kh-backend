import { useEffect, useState } from 'react';
import { cn } from '@admin/shared/lib/cn';
import { formatQty } from '@admin/shared/utils/units';

/**
 * A quantity typed in the product's unit, with up to `decimals` decimal places (0 for counted
 * units). Keeps its own text while typing ("2." stays put) and reports the number on each change.
 */
export function QtyInput({
    value,
    decimals,
    onChange,
    className,
    'aria-label': ariaLabel,
}: {
    value: number;
    decimals: number;
    onChange: (qty: number) => void;
    className?: string;
    'aria-label'?: string;
}) {
    const [text, setText] = useState(() => String(value));
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (!editing) setText(formatQty(value).replace(/,/g, ''));
    }, [value, editing]);

    return (
        <input
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            aria-label={ariaLabel}
            value={text}
            onFocus={(e) => {
                setEditing(true);
                e.target.select();
            }}
            onBlur={() => setEditing(false)}
            onChange={(e) => {
                const next = cleanQty(e.target.value, decimals);
                setText(next);
                const n = Number(next);
                if (next !== '' && Number.isFinite(n)) onChange(n);
            }}
            className={cn(
                'h-7 w-16 rounded-lg border border-line bg-white text-center text-[13px] font-bold tabular-nums outline-none focus:border-brand-400',
                className,
            )}
        />
    );
}

/** Digits, plus one decimal point with up to `decimals` places when the unit allows them. */
export function cleanQty(raw: string, decimals: number): string {
    if (decimals === 0) return raw.replace(/[^0-9]/g, '');
    const [whole, ...rest] = raw.replace(/[^0-9.]/g, '').split('.');
    return rest.length === 0
        ? whole
        : `${whole}.${rest.join('').slice(0, decimals)}`;
}
