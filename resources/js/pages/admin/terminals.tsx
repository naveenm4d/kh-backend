import { Head } from '@inertiajs/react';
import { TerminalsPage } from '@admin/features/terminals/pages/TerminalsPage';

export default function TerminalsPageRoute() {
    return (
        <>
            <Head title="Terminals" />
            <TerminalsPage />
        </>
    );
}
