import { Head } from '@inertiajs/react';
import { ActivityPage } from '@admin/features/activity/pages/ActivityPage';

export default function ActivityPageRoute() {
    return (
        <>
            <Head title="Activity log" />
            <ActivityPage />
        </>
    );
}
