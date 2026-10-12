/**
 * Cashier codes print on bills instead of names. Same rule as Go (services/mockdata/staff.go):
 * lowercase letters, words joined by single hyphens, 2–24 characters, unique.
 */
export const CODE_PATTERN = /^[a-z]+(-[a-z]+)*$/;

/** Cleans typing as it happens: lowercase, spaces become hyphens, anything else is dropped. */
export function sanitizeCode(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z-]/g, '')
        .replace(/-{2,}/g, '-')
        .replace(/^-/, '')
        .slice(0, 24);
}

export function codeError(code: string, taken: string[]): string | null {
    if (!code) return 'Enter a code; it prints on bills';
    if (code.length < 2) return 'At least 2 letters';
    if (!CODE_PATTERN.test(code))
        return 'Letters only, with single hyphens between words';
    if (taken.includes(code)) return 'Someone already uses this code';
    return null;
}

/** First name ("kasun"), then first name + last initial ("kasun-f"), then full name, then a letter suffix. */
export function suggestCode(fullName: string, taken: string[]): string {
    const words = fullName
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z]/g, ''))
        .filter(Boolean);
    if (words.length === 0) return '';
    const [first, ...rest] = words;
    const last = rest.at(-1);
    const candidates = [
        first,
        last && `${first}-${last[0]}`,
        last && `${first}-${last}`,
    ].filter((c): c is string => !!c && c.length >= 2);
    for (const c of candidates)
        if (!taken.includes(c.slice(0, 24))) return c.slice(0, 24);
    const base = (candidates.at(-1) ?? first).slice(0, 22);
    for (const ch of 'abcdefghijklmnopqrstuvwxyz')
        if (!taken.includes(`${base}-${ch}`)) return `${base}-${ch}`;
    return base;
}
