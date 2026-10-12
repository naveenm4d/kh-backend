import { Head } from '@inertiajs/react';
import { CatalogPage } from '@admin/features/catalog/pages/CatalogPage';

export default function CatalogPageRoute() {
    return (
        <>
            <Head title="Catalog" />
            <CatalogPage />
        </>
    );
}
