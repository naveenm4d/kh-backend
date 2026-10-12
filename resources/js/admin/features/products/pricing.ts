import type { Product } from '@admin/features/products/types';

/** The price a sale line starts from: the marked display price when it's above the selling price, otherwise the selling price. */
export function listPrice(p: Pick<Product, 'price' | 'displayPrice'>): number {
    return p.displayPrice > p.price ? p.displayPrice : p.price;
}

/** Discount % that brings the display price down to the selling price, or 0 when there's no display price.
 * Kept to 4 dp so the line total lands on the selling price to within a cent; UIs show it rounded. */
export function autoDiscountPct(
    p: Pick<Product, 'price' | 'displayPrice'>,
): number {
    if (!(p.displayPrice > p.price)) return 0;
    return (
        Math.round(((p.displayPrice - p.price) / p.displayPrice) * 1_000_000) /
        10_000
    );
}

/** How a discount % is shown everywhere on screen: up to 2 dp, trailing zeros dropped (9.35, 10, 7.5). */
export function formatPct(pct: number): number {
    return +pct.toFixed(2);
}
