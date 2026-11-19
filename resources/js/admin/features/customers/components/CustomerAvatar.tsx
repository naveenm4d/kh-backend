import { cn } from '@admin/shared/lib/cn';

const TONES = [
    'bg-brand-100 text-brand-800',
    'bg-[#f6e3c8] text-[#7a4d12]',
    'bg-[#d8efe9] text-[#1f6b5f]',
    'bg-[#f3dce8] text-[#8a2f61]',
    'bg-[#e2e6ee] text-[#3d4656]',
    'bg-[#dcefd6] text-[#3a6e2f]',
];

export function customerInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * Initials avatar whose tint is derived from the name, so the same customer always gets the same color.
 * `mono` uses the admin's single blue wash instead (DESIGN.md One Blue Rule); POS keeps the tints.
 */
export function CustomerAvatar({
    name,
    className,
    mono,
}: {
    name: string;
    className?: string;
    mono?: boolean;
}) {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    const tone = mono
        ? 'bg-brand-100 text-brand-700'
        : TONES[Math.abs(hash) % TONES.length];

    return (
        <div
            className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                tone,
                className,
            )}
        >
            {customerInitials(name)}
        </div>
    );
}
