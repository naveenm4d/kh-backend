import type { HTMLAttributes } from 'react';
import { cn } from '@admin/shared/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'rounded-card border border-line bg-canvas-card shadow-soft',
                className,
            )}
            {...props}
        />
    );
}
