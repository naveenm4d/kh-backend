import { createInertiaApp } from '@inertiajs/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/admin-layout';
import AuthLayout from '@/layouts/auth-layout';
import { ConfirmProvider } from '@admin/shared/components/ConfirmDialog';
import { ToastProvider } from '@admin/shared/components/Toast';
import { queryClient } from '@admin/shared/lib/queryClient';

const appName = import.meta.env.VITE_APP_NAME || 'Kulatissa Hardware';

void createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    layout: (name) => (name.startsWith('auth/') ? AuthLayout : AdminLayout),
    strictMode: true,
    withApp(app) {
        // Providers sit above the page layout, so the query cache (and anything it holds) survives
        // moving between admin pages.
        return (
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <ConfirmProvider>
                        <TooltipProvider delayDuration={0}>
                            {app}
                            <Toaster />
                        </TooltipProvider>
                    </ConfirmProvider>
                </ToastProvider>
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#3B6DEC',
    },
});
