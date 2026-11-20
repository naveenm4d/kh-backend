import { Head } from '@inertiajs/react';
import { InventoryPage } from '@admin/features/inventory/pages/InventoryPage';

export default function InventoryPageRoute() {
    return (
        <>
            <Head title="Inventory" />
            <InventoryPage />
        </>
    );
}
