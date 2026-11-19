import { Head } from '@inertiajs/react';
import { CustomersPage } from '@admin/features/customers/pages/CustomersPage';

export default function CustomersPageRoute() {
    return (
        <>
            <Head title="Customers" />
            <CustomersPage />
        </>
    );
}
