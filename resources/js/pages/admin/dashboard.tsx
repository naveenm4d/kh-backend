import { Head } from '@inertiajs/react';
import { DashboardPage } from '@admin/features/dashboard/pages/DashboardPage';

export default function DashboardPageRoute() {
    return (
        <>
            <Head title="Dashboard" />
            <DashboardPage />
        </>
    );
}
