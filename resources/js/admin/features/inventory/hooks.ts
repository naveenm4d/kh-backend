export {
    useProducts as useInventoryProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useReceiveStock,
    useBrands,
} from '@admin/features/products/hooks';
export { useCategories } from '@admin/features/categories/hooks';

export { useStockThresholds } from '@admin/features/settings/shop';
export type { StockThresholds } from '@admin/features/settings/shop';
import type { StockThresholds } from '@admin/features/settings/shop';

/** Fallback thresholds; the live values come from shop settings (useStockThresholds). */
const DEFAULT_THRESHOLDS: StockThresholds = { low: 20, critical: 5 };

export type StockTone = 'success' | 'warning' | 'danger';

export function getStockStatus(
    stock: number,
    t: StockThresholds = DEFAULT_THRESHOLDS,
): { label: string; tone: StockTone } {
    if (stock <= 0) return { label: 'Out of stock', tone: 'danger' };
    if (stock <= t.critical) return { label: 'Very low', tone: 'danger' };
    if (stock <= t.low) return { label: 'Low stock', tone: 'warning' };
    return { label: 'In stock', tone: 'success' };
}

/** "Out of stock" or "3 rolls left": the stock chip's wording everywhere in the admin. */
export function stockChipLabel(
    stock: number,
    unit: string,
    unitCount: (n: number, u: string, measured?: boolean) => string,
    measured = false,
): string {
    return stock <= 0
        ? 'Out of stock'
        : `${unitCount(stock, unit, measured)} left`;
}
