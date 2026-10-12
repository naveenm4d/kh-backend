import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
    ThermalReceipt,
    hasWarehouseItems,
} from '@admin/shared/components/ThermalReceipt';
import type { ReceiptData } from '@admin/shared/components/ThermalReceipt';
import { useShopSettings } from '@admin/features/settings/shop';

/**
 * Prints a bill from the admin console with the browser's print dialog (any printer, or PDF). The
 * receipt renders into a print-only root that the print stylesheet shows on its own.
 */
export function usePrintReceipt() {
    const shop = useShopSettings();
    const [isPrinting, setIsPrinting] = useState(false);

    const print = async (
        data: ReceiptData,
        opts: { warehouseSlip?: boolean } = {},
    ) => {
        setIsPrinting(true);
        const host = document.createElement('div');
        host.id = 'print-root';
        document.body.appendChild(host);
        const root = createRoot(host);
        try {
            flushSync(() =>
                root.render(
                    <ThermalReceipt
                        data={data}
                        shop={shop}
                        warehouseSlip={
                            opts.warehouseSlip ?? hasWarehouseItems(data)
                        }
                    />,
                ),
            );
            // Let the QR code and fonts paint before the dialog snapshots the page.
            await new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
            );
            window.print();
        } finally {
            root.unmount();
            host.remove();
            setIsPrinting(false);
        }
    };

    return { print, isPrinting };
}
