import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCurrentUser } from '@admin/features/auth/hooks';
import { BrandMark } from '@admin/shared/components/BrandMark';
import { Sidebar } from '@admin/shared/components/Sidebar';
import {
    ADMIN_NAV_ITEMS,
    ADMIN_NAV_SECTIONS,
} from '@admin/shared/constants/nav';
import { cn } from '@admin/shared/lib/cn';
import { queryClient } from '@admin/shared/lib/queryClient';

const NAV_BY_KEY = new Map(ADMIN_NAV_ITEMS.map((item) => [item.key, item]));

export default function AdminLayout({ children }: { children: ReactNode }) {
    const user = useCurrentUser();
    const { url } = usePage();
    const path = url.split('?')[0];
    const perms = user?.permissions ?? [];

    const logout = () => {
        router.post('/logout', {}, { onFinish: () => queryClient.clear() });
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-canvas text-ink">
            <Sidebar
                header={
                    <div className="flex items-center gap-2.5">
                        <BrandMark className="size-8" />
                        <div className="min-w-0 leading-tight">
                            <div className="truncate text-[13px] font-semibold text-ink">
                                Kulatissa Hardware
                            </div>
                            <div className="text-xs text-ink-muted">
                                Back office
                            </div>
                        </div>
                    </div>
                }
                footer={
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/settings/security"
                            className={cn(
                                'flex h-8 items-center gap-2.5 rounded-lg border px-2 text-[13px] font-medium transition-colors',
                                path.startsWith('/settings')
                                    ? 'border-line bg-canvas-card text-ink shadow-soft'
                                    : 'border-transparent text-ink-muted hover:bg-ink/[0.04] hover:text-ink',
                            )}
                        >
                            <ShieldCheck className="size-4 shrink-0 text-ink-subtle" />
                            Password & sign-in
                        </Link>
                        <div className="flex items-center gap-2.5 border-t border-line px-1.5 pt-3">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                                {user?.initials}
                            </div>
                            <div className="min-w-0 flex-1 leading-tight">
                                <div className="truncate text-[13px] font-medium">
                                    {user?.name}
                                </div>
                                <div className="text-xs text-ink-muted">
                                    {user?.roleName}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={logout}
                                className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger-text"
                                title="Log out"
                                aria-label="Log out"
                            >
                                <LogOut className="size-4" />
                            </button>
                        </div>
                    </div>
                }
            >
                {ADMIN_NAV_SECTIONS.filter((section) =>
                    section.items.some((k) =>
                        perms.includes(
                            NAV_BY_KEY.get(k)?.permission ?? 'page.dashboard',
                        ),
                    ),
                ).map((section) => (
                    <div key={section.label} className="flex flex-col gap-px">
                        <div className="px-2 pb-1.5 text-xs font-medium text-ink-muted">
                            {section.label}
                        </div>
                        {section.items.map((key) => {
                            const item = NAV_BY_KEY.get(key);
                            if (!item || !perms.includes(item.permission)) {
                                return null;
                            }
                            const isActive =
                                path === item.to ||
                                path.startsWith(`${item.to}/`);

                            return (
                                <Link
                                    key={item.key}
                                    href={item.to}
                                    prefetch
                                    className={cn(
                                        'group flex h-8 items-center gap-2.5 rounded-lg border px-2 text-[13px] font-medium transition-colors',
                                        isActive
                                            ? 'border-line bg-canvas-card text-ink shadow-soft'
                                            : 'border-transparent text-ink-muted hover:bg-ink/[0.04] hover:text-ink',
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            'size-4 shrink-0',
                                            isActive
                                                ? 'text-brand-600'
                                                : 'text-ink-subtle group-hover:text-ink-muted',
                                        )}
                                    />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </Sidebar>

            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
    );
}
