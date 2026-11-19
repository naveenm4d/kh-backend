import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import PasskeyVerify from '@/components/passkey-verify';
import { store } from '@/routes/login';
import { cn } from '@admin/shared/lib/cn';

type Props = {
    status?: string;
};

/** Console-sized sign-in field (DESIGN.md control radius, focus ring from the brand blue). */
const fieldClass = (invalid: boolean) =>
    cn(
        'h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink transition-colors outline-none placeholder:text-ink-subtle focus:ring-3',
        invalid
            ? 'border-danger-text/60 focus:ring-danger-bg'
            : 'border-line focus:border-brand-400 focus:ring-brand-100',
    );

const labelClass = 'text-[13px] font-medium text-ink';

function PasswordField({ invalid }: { invalid: boolean }) {
    const [show, setShow] = useState(false);
    const [caps, setCaps] = useState(false);
    const checkCaps = (e: KeyboardEvent<HTMLInputElement>) =>
        setCaps(e.getModifierState?.('CapsLock') ?? false);

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor="password" className={labelClass}>
                Password
            </label>
            <div className="relative">
                <input
                    id="password"
                    name="password"
                    type={show ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    onKeyUp={checkCaps}
                    onKeyDown={checkCaps}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? 'login-error' : undefined}
                    className={cn(fieldClass(invalid), 'pr-10')}
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:text-ink"
                >
                    {show ? (
                        <EyeOff className="size-4" />
                    ) : (
                        <Eye className="size-4" />
                    )}
                </button>
            </div>
            {caps && (
                <div className="text-xs font-medium text-warning-text">
                    Caps Lock is on
                </div>
            )}
        </div>
    );
}

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Sign in" />

            {status && (
                <div
                    role="status"
                    className="mb-5 flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2.5 text-[13px] font-medium text-success-text"
                >
                    <CheckCircle2 className="mt-px size-4 shrink-0" />
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnError={['password']}
                resetOnSuccess={['password']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => {
                    // Fortify reports a failed or throttled sign-in on the email key; it's about the pair.
                    const error = errors.email ?? errors.password;

                    return (
                        <>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className={labelClass}>
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    spellCheck={false}
                                    placeholder="you@kulatissahardware.lk"
                                    aria-invalid={!!error || undefined}
                                    aria-describedby={
                                        error ? 'login-error' : undefined
                                    }
                                    className={fieldClass(!!error)}
                                />
                            </div>

                            <PasswordField invalid={!!error} />

                            {error && (
                                <div
                                    id="login-error"
                                    role="alert"
                                    className="-mt-1 text-[13px] font-medium text-danger-text"
                                >
                                    {error}
                                </div>
                            )}

                            <label className="flex cursor-pointer items-center gap-2 self-start text-[13px] text-ink-muted">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="size-4 cursor-pointer accent-brand-500"
                                />
                                Keep me signed in on this computer
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                data-test="login-button"
                                className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-70"
                            >
                                {processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <LogIn className="size-4" />
                                )}
                                {processing ? 'Signing in…' : 'Sign in'}
                            </button>
                        </>
                    );
                }}
            </Form>

            <PasskeyVerify />

            <p className="mt-6 border-t border-line pt-4 text-[13px] text-ink-muted">
                Forgot your password? Ask an admin to reset it.
            </p>
        </>
    );
}

Login.layout = {
    title: 'Sign in',
    description: 'Use the email and password from your staff account.',
};
