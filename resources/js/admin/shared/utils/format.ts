import { formatQty } from '@admin/shared/utils/units';

/** "3 Oct": the dashboard's one short date form. */
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

export function shortDate(iso: string): string {
    return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
}

/** Percentage change, or null when there's no baseline to compare against. */
export function percentChange(
    current: number,
    previous: number,
): number | null {
    if (previous <= 0) return null;
    return ((current - previous) / previous) * 100;
}

/** "Today" / "Yesterday" / "08 Jul", relative to the dashboard's own today (the trend's last date). */
export function relativeDay(iso: string, todayIso: string): string {
    if (iso === todayIso) return 'Today';
    const today = new Date(todayIso + 'T00:00:00');
    today.setDate(today.getDate() - 1);
    const y = today;
    const yesterdayIso = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    if (iso === yesterdayIso) return 'Yesterday';
    return shortDate(iso);
}

/** Compact rupee figure for chart axes: 0, 25k, 1.2M. */
export function compactRupees(n: number): string {
    if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${+(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    return String(Math.round(n));
}

/** Rounds a max up to a clean axis ceiling split into `ticks` steps of 1/2/2.5/5 × 10^n. */
export function niceScale(
    max: number,
    ticks = 4,
): { ceiling: number; step: number } {
    if (max <= 0) return { ceiling: ticks, step: 1 };
    const raw = max / ticks;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const step =
        [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ??
        10 * pow;
    return { ceiling: step * ticks, step };
}

/** "8 Oct" this year, "8 Oct 2025" otherwise; "—" for an empty date. */
export function dateLabel(iso: string): string {
    if (!iso) return '—';
    return iso.slice(0, 4) === String(new Date().getFullYear())
        ? shortDate(iso)
        : `${shortDate(iso)} ${iso.slice(0, 4)}`;
}

/** "1 roll", "3 rolls", "18 boxes": a count with its unit name, pluralised; "2.5 kg" for measured units. */
export function unitCount(n: number, unit: string, measured = false): string {
    if (measured) return `${formatQty(n)} ${unit}`;
    const u = unit.toLowerCase();
    if (n === 1) return `${n.toLocaleString('en-US')} ${u}`;
    return `${n.toLocaleString('en-US')} ${/(s|x|z|ch|sh)$/.test(u) ? u + 'es' : u + 's'}`;
}

/** "1 bill", "2 bills". */
export function plural(n: number, one: string, many = `${one}s`): string {
    return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}
