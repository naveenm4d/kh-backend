const dateTime = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
});

const day = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
});

/** "21 Nov 2026, 14:05" */
export function formatDateTime(iso: string): string {
    return dateTime.format(new Date(iso));
}

/** "14:05" today, "21 Nov · 14:05" otherwise. */
export function formatWhen(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    return d.toDateString() === today.toDateString()
        ? time.format(d)
        : `${day.format(d)} · ${time.format(d)}`;
}
