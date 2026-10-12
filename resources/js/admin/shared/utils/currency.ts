export function formatCurrency(amount: number): string {
    return 'Rs. ' + Math.round(amount || 0).toLocaleString('en-US');
}

export function parseCurrencyInput(value: string): number {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Cleans a money amount as it's typed, so the box never shows an invalid number:
 * digits and one decimal point only, no leading zeros ("0110" → "110", "002500" → "2500", "00" → ""),
 * a zero kept only before the point (".5" → "0.5"), at most 2 decimals and 9 whole-rupee digits.
 */
export function sanitizeAmountInput(raw: string): string {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const dot = cleaned.indexOf('.');
    const intPart = (dot === -1 ? cleaned : cleaned.slice(0, dot))
        .replace(/^0+/, '')
        .slice(0, 9);
    if (dot === -1) return intPart;
    const decimals = cleaned
        .slice(dot + 1)
        .replace(/\./g, '')
        .slice(0, 2);
    return `${intPart || '0'}.${decimals}`;
}
