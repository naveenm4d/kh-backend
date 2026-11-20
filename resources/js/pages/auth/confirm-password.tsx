import { Form, Head } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import PasswordInput from '@/components/password-input';
import { store } from '@/routes/password/confirm';
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import PasskeyVerify from '@/components/passkey-verify';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="password"
                                className="text-[13px] font-medium text-ink"
                            >
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                autoComplete="current-password"
                                autoFocus
                                aria-invalid={
                                    errors.password ? true : undefined
                                }
                                className="h-10 bg-white"
                            />
                            {errors.password && (
                                <div
                                    role="alert"
                                    className="text-[13px] font-medium text-danger-text"
                                >
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            data-test="confirm-password-button"
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-70"
                        >
                            {processing && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            Confirm password
                        </button>
                    </div>
                )}
            </Form>

            <PasskeyVerify
                routes={{
                    options: confirmOptions(),
                    submit: confirmStore(),
                }}
                label="Confirm with a passkey"
                loadingLabel="Confirming…"
            />
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm your password',
    description: 'This is a protected area. Enter your password to continue.',
};
