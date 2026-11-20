export function formatDateShort(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function formatDateLong(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatMonthLabel(yyyyMm: string): string {
    return new Date(yyyyMm + '-01').toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    });
}

export function todayIso(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10);
}

export function nowLabel(): string {
    const now = new Date();
    return (
        now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }) +
        ' · ' +
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    );
}
