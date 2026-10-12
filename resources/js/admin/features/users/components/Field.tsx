import type { ReactNode } from 'react';

/** Label + control + optional hint/error, for the panel forms. */
export function Field({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string | null;
    children: ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-muted">{label}</span>
            {children}
            {(error || hint) && (
                <span
                    className={
                        error
                            ? 'text-xs text-danger-text'
                            : 'text-xs text-ink-muted'
                    }
                >
                    {error ?? hint}
                </span>
            )}
        </label>
    );
}
