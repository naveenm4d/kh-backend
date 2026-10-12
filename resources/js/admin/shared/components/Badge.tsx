import type { HTMLAttributes } from 'react';
import { cn } from '@admin/shared/lib/cn';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'brand';

const TONE_CLASSES: Record<BadgeTone, string> = {
    success: 'bg-success-bg text-success-text',
    warning: 'bg-warning-bg text-warning-text',
    danger: 'bg-danger-bg text-danger-text',
    neutral: 'bg-canvas text-ink-muted',
    brand: 'bg-brand-50 text-brand-700',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: BadgeTone;
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
                TONE_CLASSES[tone],
                className,
            )}
            {...props}
        />
    );
}
