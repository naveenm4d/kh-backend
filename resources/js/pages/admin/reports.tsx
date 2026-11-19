import { Head } from '@inertiajs/react';
import { ReportsPage } from '@admin/features/reports/pages/ReportsPage';

export default function ReportsPageRoute() {
    return (
        <>
            <Head title="Reports" />
            <ReportsPage />
        </>
    );
}
