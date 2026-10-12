import { Head } from '@inertiajs/react';
import { SettingsPage } from '@admin/features/settings/pages/SettingsPage';

export default function SettingsPageRoute() {
    return (
        <>
            <Head title="Settings" />
            <SettingsPage />
        </>
    );
}
