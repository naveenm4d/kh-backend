import type { UrlMethodPair } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type Props = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
};

export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
}: Props = {}) {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        ...(routes && {
            routes: {
                options: routes.options.url,
                submit: routes.submit.url,
            },
        }),
        onSuccess: (response) => {
            router.visit(response.redirect ?? '/dashboard');
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-xs text-ink-muted">
                <Separator className="flex-1" />
                <span>{separator ?? 'or'}</span>
                <Separator className="flex-1" />
            </div>

            <div className="flex flex-col gap-1.5">
                <button
                    type="button"
                    onClick={verify}
                    disabled={isLoading}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-70"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <KeyRound className="size-4" />
                    )}
                    {isLoading
                        ? (loadingLabel ?? 'Waiting for your passkey…')
                        : (label ?? 'Sign in with a passkey')}
                </button>
                {error && (
                    <div
                        role="alert"
                        className="text-[13px] font-medium text-danger-text"
                    >
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
