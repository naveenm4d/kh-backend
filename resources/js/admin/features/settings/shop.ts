import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@admin/shared/lib/http';

/** Shared by every till: the details printed on receipts and the low / very-low stock levels. */
export interface ShopSettings {
    storeName: string;
    address: string;
    phone: string;
    regNo: string;
    receiptFooter: string;
    lowStock: number;
    criticalStock: number;
}

/** Used until the first load lands, so stock badges never render blank. */
export const DEFAULT_SHOP: ShopSettings = {
    storeName: 'Kulatissa Hardware',
    address: '',
    phone: '',
    regNo: '',
    receiptFooter: '',
    lowStock: 20,
    criticalStock: 5,
};

export const shopKey = ['settings', 'shop'] as const;

export function useShopSettings(): ShopSettings {
    const { data } = useQuery({
        queryKey: shopKey,
        queryFn: () => http.get<ShopSettings>('/settings/shop'),
        staleTime: 5 * 60_000,
    });
    return data ?? DEFAULT_SHOP;
}

export function useUpdateShopSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: ShopSettings) =>
            http.put<ShopSettings>('/settings/shop', input),
        onSuccess: (saved) => {
            qc.setQueryData(shopKey, saved);
            // Thresholds move the dashboard's low-stock list.
            void qc.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export interface StockThresholds {
    low: number;
    critical: number;
}

export function useStockThresholds(): StockThresholds {
    const s = useShopSettings();
    return { low: s.lowStock, critical: s.criticalStock };
}
