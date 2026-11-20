import { Head } from '@inertiajs/react';
import { UsersPage } from '@admin/features/users/pages/UsersPage';

export default function UsersPageRoute() {
    return (
        <>
            <Head title="Users & roles" />
            <UsersPage />
        </>
    );
}
