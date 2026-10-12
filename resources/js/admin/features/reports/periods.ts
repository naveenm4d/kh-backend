import type { ReportGranularity } from '@admin/features/reports/types';

export type PeriodPreset =
    | 'today'
    | 'yesterday'
    | 'this-week'
    | 'last-week'
    | 'this-month'
    | 'last-month'
    | 'this-year'
    | 'last-year'
    | 'day'
    | 'custom';

export type CompareMode = 'previous' | 'last-year' | 'custom';

export interface DateRange {
    from: string;
    to: string;
}

export const PRESET_OPTIONS: { value: PeriodPreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this-week', label: 'This week' },
    { value: 'last-week', label: 'Last week' },
    { value: 'this-month', label: 'This month' },
    { value: 'last-month', label: 'Last month' },
    { value: 'this-year', label: 'This year' },
    { value: 'last-year', label: 'Last year' },
    { value: 'day', label: 'A single day…' },
    { value: 'custom', label: 'Custom range…' },
];

const SINGLE_DAY: PeriodPreset[] = ['today', 'yesterday', 'day'];

/** "Previous" means the same weekday a week earlier for a single day, so its label says so. */
export function compareOptions(
    preset: PeriodPreset,
): { value: CompareMode; label: string }[] {
    const single = SINGLE_DAY.includes(preset);
    return [
        {
            value: 'previous',
            label: single ? 'Same day last week' : 'Previous period',
        },
        {
            value: 'last-year',
            label: single ? 'Same date last year' : 'Same period last year',
        },
        {
            value: 'custom',
            label: single ? 'Another day or range…' : 'Custom range…',
        },
    ];
}

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Local-time YYYY-MM-DD (never toISOString, which shifts the date in UTC+5:30 before 05:30). */
export function iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parse(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
}

/** Same day-of-month `n` months away, clamped (31 Mar − 1 month → 28/29 Feb). */
function shiftMonths(d: Date, n: number) {
    const y = d.getFullYear();
    const m = d.getMonth() + n;
    const target = new Date(y, m, 1);
    return new Date(
        target.getFullYear(),
        target.getMonth(),
        Math.min(
            d.getDate(),
            daysInMonth(target.getFullYear(), target.getMonth()),
        ),
    );
}

export function rangeLength(r: DateRange): number {
    return (
        Math.round(
            (parse(r.to).getTime() - parse(r.from).getTime()) / 86_400_000,
        ) + 1
    );
}

export function isValidRange(r: DateRange): boolean {
    return (
        /^\d{4}-\d{2}-\d{2}$/.test(r.from) &&
        /^\d{4}-\d{2}-\d{2}$/.test(r.to) &&
        r.from <= r.to
    );
}

export function resolvePreset(
    preset: PeriodPreset,
    today: Date,
    custom: DateRange,
    day: string,
): DateRange {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const mondayOffset = (t.getDay() + 6) % 7;
    switch (preset) {
        case 'today':
            return { from: iso(t), to: iso(t) };
        case 'yesterday':
            return { from: iso(addDays(t, -1)), to: iso(addDays(t, -1)) };
        case 'this-week':
            return { from: iso(addDays(t, -mondayOffset)), to: iso(t) };
        case 'last-week':
            return {
                from: iso(addDays(t, -mondayOffset - 7)),
                to: iso(addDays(t, -mondayOffset - 1)),
            };
        case 'this-month':
            return {
                from: iso(new Date(t.getFullYear(), t.getMonth(), 1)),
                to: iso(t),
            };
        case 'last-month':
            return {
                from: iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)),
                to: iso(new Date(t.getFullYear(), t.getMonth(), 0)),
            };
        case 'this-year':
            return { from: iso(new Date(t.getFullYear(), 0, 1)), to: iso(t) };
        case 'last-year':
            return {
                from: iso(new Date(t.getFullYear() - 1, 0, 1)),
                to: iso(new Date(t.getFullYear() - 1, 11, 31)),
            };
        case 'day':
            return { from: day, to: day };
        case 'custom':
            return custom;
    }
}

/**
 * The comparison range for A. "Previous" keeps calendar shapes: a month (or month-to-date) compares with the
 * same days of the month before, a year with the year before, anything else with the equally long run of days
 * just before it.
 */
export function resolveCompare(
    mode: CompareMode,
    a: DateRange,
    preset: PeriodPreset,
    custom: DateRange,
): DateRange {
    if (mode === 'custom') return custom;
    const from = parse(a.from);
    const to = parse(a.to);
    if (mode === 'last-year')
        return {
            from: iso(shiftMonths(from, -12)),
            to: iso(shiftMonths(to, -12)),
        };
    if (preset === 'this-month' || preset === 'last-month') {
        const prevFrom = shiftMonths(from, -1);
        const prevTo =
            preset === 'last-month'
                ? new Date(from.getFullYear(), from.getMonth(), 0)
                : shiftMonths(to, -1);
        return { from: iso(prevFrom), to: iso(prevTo) };
    }
    if (preset === 'this-year' || preset === 'last-year')
        return {
            from: iso(shiftMonths(from, -12)),
            to: iso(shiftMonths(to, -12)),
        };
    // Weeks (week-to-date too) and single days compare with the same weekdays a week earlier:
    // a Tuesday against a Tuesday, since trade follows the weekly rhythm.
    if (
        preset === 'this-week' ||
        preset === 'last-week' ||
        SINGLE_DAY.includes(preset)
    )
        return { from: iso(addDays(from, -7)), to: iso(addDays(to, -7)) };
    const len = rangeLength(a);
    return { from: iso(addDays(from, -len)), to: iso(addDays(from, -1)) };
}

/** Long ranges bucket by month so a year reads as 12 points, not 365. */
export function granularityFor(r: DateRange): ReportGranularity {
    return rangeLength(r) > 92 ? 'month' : 'day';
}

/** "8 Oct", "Thu 8 Oct" (withWeekday), or "Oct 2026" for a month key. */
export function formatKey(key: string, withWeekday = false): string {
    if (key.length === 7)
        return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
    const d = parse(key);
    return `${withWeekday ? WEEKDAYS[d.getDay()] + ' ' : ''}${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** formatRange without the year, for inline "vs … · 1–9 Sep" labels. */
export function formatRangeShort(r: DateRange): string {
    return formatRange(r).replace(/ \d{4}/g, '');
}

/** "1–8 Oct 2026", "8 Sep – 3 Oct 2026", "Thu 8 Oct 2026", "Jan–Dec 2025". */
export function formatRange(r: DateRange): string {
    const a = parse(r.from);
    const b = parse(r.to);
    if (r.from === r.to)
        return `${WEEKDAYS[a.getDay()]} ${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    const sameYear = a.getFullYear() === b.getFullYear();
    const wholeMonths =
        a.getDate() === 1 &&
        b.getDate() === daysInMonth(b.getFullYear(), b.getMonth());
    if (wholeMonths && sameYear) {
        return a.getMonth() === b.getMonth()
            ? `${MONTHS[a.getMonth()]} ${a.getFullYear()}`
            : `${MONTHS[a.getMonth()]}–${MONTHS[b.getMonth()]} ${a.getFullYear()}`;
    }
    if (sameYear && a.getMonth() === b.getMonth())
        return `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    if (sameYear)
        return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}
