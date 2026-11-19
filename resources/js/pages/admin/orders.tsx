import { Head } from '@inertiajs/react';
import { OrdersPage } from '@admin/features/orders/pages/OrdersPage';

export default function OrdersPageRoute() {
    return (
        <>
            <Head title="Orders" />
            <OrdersPage />
        </>
    );
}
