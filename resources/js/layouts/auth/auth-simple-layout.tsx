import { useEffect, useState } from 'react';
import type { AuthLayoutProps } from '@/types';
import { BrandPlate } from '@admin/shared/components/BrandPlate';

/** Live clock for the brand panel, as on the till's sign-in screen. */
function useNow() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 15_000);
        return () => window.clearInterval(id);
    }, []);
    return now;
}

/**
 * Sign-in, two-factor and password-confirm screens. Mirrors the till's sign-in screen
 * (desktopapp LoginPage): a charcoal brand panel with the plate, the shop and the time, and the form
 * column beside it. Below `lg` the panel collapses to a small plate above the form.
 */
export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const now = useNow();

    return (
        <div className="grid min-h-svh grid-cols-1 bg-canvas lg:grid-cols-[minmax(380px,44%)_1fr]">
            {/* Charcoal, not the band's own black, so the plate's black label band and keyline stay legible on it. */}
            <aside className="sticky top-0 hidden h-svh flex-col justify-between bg-[#26231F] px-12 py-10 text-[#F2EDE2] lg:flex">
                {/* Spacer: keeps the plate centred between the top and the clock below. */}
                <div aria-hidden />
                <div className="flex flex-col items-center gap-8">
                    <BrandPlate className="w-[min(340px,70%)] drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)]" />
                    <div className="text-center">
                        <div className="text-3xl font-extrabold tracking-tight">
                            Kulatissa Hardware
                        </div>
                        <div className="mt-1.5 text-sm text-[#F2EDE2]/60">
                            Back office
                        </div>
                    </div>
                </div>
                <div className="flex items-end justify-between text-[#F2EDE2]/70 tabular-nums">
                    <time
                        dateTime={now.toISOString()}
                        className="text-4xl font-semibold tracking-tight text-[#F2EDE2]"
                    >
                        {now.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </time>
                    <div className="text-sm">
                        {now.toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </div>
                </div>
            </aside>

            <main className="flex min-h-svh flex-col">
                <div className="flex items-center gap-3 px-8 pt-8 lg:hidden">
                    <BrandPlate className="size-12" />
                    <div className="leading-tight">
                        <div className="text-lg font-extrabold">
                            Kulatissa Hardware
                        </div>
                        <div className="text-xs text-ink-muted">
                            Back office
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center px-8 py-10">
                    <div className="w-full max-w-sm">
                        <header className="mb-6">
                            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-balance text-ink">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-1 text-sm text-pretty text-ink-muted">
                                    {description}
                                </p>
                            )}
                        </header>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
