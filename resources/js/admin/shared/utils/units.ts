/**
 * Quantity helpers. Units are a catalogue list on the server: each product (and bill line) says
 * whether its unit is `measured` (length or weight: "2.5 kg") and how many decimals it allows.
 */

/** Whether the quantity has no more than `decimals` decimal places. */
export function qtyFits(qty: number, decimals: number): boolean {
    const scale = 10 ** decimals;
    return Math.abs(Math.round(qty * scale) - qty * scale) < 1e-6;
}

/** "1", "0.01" or "0.001": an input's step for this many decimals. */
export function qtyStep(decimals: number): string {
    return decimals === 0 ? '1' : (10 ** -decimals).toFixed(decimals);
}

/** Rounds to the given decimals (drops float noise like 0.30000000000000004). */
export function roundQty(qty: number, decimals: number): number {
    const scale = 10 ** decimals;
    return Math.round(qty * scale) / scale;
}

/** "1,250", "2.5", "0.125": the number alone, without trailing zeros. */
export function formatQty(qty: number): string {
    return qty.toLocaleString('en-US', { maximumFractionDigits: 3 });
}

/** What a bill line's quantity reads as: "3" for counted units, "2.5 kg" for measured ones. */
export function lineQty(qty: number, unit: string, measured: boolean): string {
    return measured ? `${formatQty(qty)} ${unit}` : formatQty(qty);
}

/** Message for a quantity with more decimals than allowed; '' when it fits. */
export function qtyError(qty: number, decimals: number): string {
    if (qtyFits(qty, decimals)) return '';
    return decimals === 0
        ? 'Whole numbers only'
        : `Up to ${decimals} decimal place${decimals === 1 ? '' : 's'}`;
}
