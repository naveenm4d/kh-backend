import { useState } from 'react';
import {
    CompactButton,
    CompactInput,
    MiniSelect,
} from '@admin/shared/components/controls';
import {
    DetailPanel,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { useToast } from '@admin/shared/components/Toast';
import { Field } from '@admin/features/users/components/Field';
import {
    codeError,
    sanitizeCode,
    suggestCode,
} from '@admin/features/users/code';
import {
    useCreateStaffUser,
    useUpdateStaffUser,
} from '@admin/features/users/hooks';
import type { Role, StaffUser } from '@admin/features/users/types';

const MIN_PASSWORD = 6;

/** Create (user = null) or edit a staff account, inside the panel. */
export function StaffForm({
    user,
    roles,
    others,
    onDone,
    onCancel,
}: {
    user: StaffUser | null;
    roles: Role[];
    /** Every staff account, to keep codes unique. */
    others?: StaffUser[];
    onDone: (u: StaffUser) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    // New accounts get a code suggested from the name until the admin types their own.
    const [code, setCode] = useState(user?.code ?? '');
    const [codeTouched, setCodeTouched] = useState(!!user);
    const taken = (others ?? [])
        .filter((u) => u.id !== user?.id)
        .map((u) => u.code);
    const shownCode = codeTouched ? code : suggestCode(name, taken);
    const [phone, setPhone] = useState(user?.phone ?? '');
    // New accounts start on the least-privileged unlocked role, never on full access. Derived at
    // render (not in useState's initialiser) so it's right even if roles arrive after the form opens.
    const defaultRole =
        [...roles]
            .filter((r) => !r.locked)
            .sort((a, b) => a.permissions.length - b.permissions.length)[0]
            ?.id ?? '';
    const [picked, setRole] = useState<string | null>(user?.role ?? null);
    const role = picked ?? defaultRole;
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const create = useCreateStaffUser();
    const update = useUpdateStaffUser();
    const toast = useToast();

    const errors = {
        code: codeError(shownCode, taken),
        name: !name.trim() ? 'Enter their name' : null,
        email: !/^\S+@\S+\.\S+$/.test(email.trim())
            ? 'Enter a valid email; it’s what they sign in with'
            : null,
        role: !roles.some((r) => r.id === role) ? 'Choose a role' : null,
        password:
            !user && password.length < MIN_PASSWORD
                ? `At least ${MIN_PASSWORD} characters`
                : null,
    };
    const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);
    const busy = create.isPending || update.isPending;

    const save = async () => {
        setSubmitted(true);
        if (Object.values(errors).some(Boolean)) return;
        const input = {
            name: name.trim(),
            code: shownCode,
            email: email.trim(),
            phone: phone.trim(),
            role,
            active: user?.active ?? true,
        };
        try {
            const saved = user
                ? await update.mutateAsync({ id: user.id, input })
                : await create.mutateAsync({ ...input, password });
            toast.success(
                user ? 'Changes saved' : `${saved.name} can now sign in`,
            );
            onDone(saved);
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not save the account',
            );
        }
    };

    return (
        <DetailPanel
            title={user ? `Edit ${user.name}` : 'New staff account'}
            meta={
                user
                    ? user.email
                    : 'They sign in with their email and this password.'
            }
            onClose={onCancel}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                }}
            >
                <PanelSection>
                    <div className="flex flex-col gap-3">
                        <Field label="Full name" error={show('name')}>
                            <CompactInput
                                autoFocus
                                value={name}
                                invalid={!!show('name')}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Field>
                        <Field
                            label="Cashier code"
                            error={
                                show('code') ??
                                (codeTouched && code && errors.code
                                    ? errors.code
                                    : null)
                            }
                            hint={
                                shownCode
                                    ? `Bills will read “Cashier: ${shownCode}”.`
                                    : 'Printed on bills instead of their name.'
                            }
                        >
                            <CompactInput
                                value={shownCode}
                                invalid={
                                    !!show('code') ||
                                    (codeTouched && !!code && !!errors.code)
                                }
                                autoCapitalize="none"
                                spellCheck={false}
                                placeholder="e.g. kasun-f"
                                onChange={(e) => {
                                    setCodeTouched(true);
                                    setCode(sanitizeCode(e.target.value));
                                }}
                                onBlur={() =>
                                    setCode((c) => c.replace(/-+$/, ''))
                                }
                            />
                        </Field>
                        <Field label="Email" error={show('email')}>
                            <CompactInput
                                type="email"
                                value={email}
                                invalid={!!show('email')}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Field>
                        <Field label="Phone (optional)">
                            <CompactInput
                                inputMode="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </Field>
                        <Field
                            label="Role"
                            hint={roles.find((r) => r.id === role)?.description}
                        >
                            <MiniSelect
                                aria-label="Role"
                                value={role}
                                onChange={setRole}
                                options={roles.map((r) => ({
                                    value: r.id,
                                    label: r.name,
                                }))}
                            />
                        </Field>
                        {!user && (
                            <Field
                                label="Password"
                                error={show('password')}
                                hint={`At least ${MIN_PASSWORD} characters. You can reset it later.`}
                            >
                                <CompactInput
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    invalid={!!show('password')}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </Field>
                        )}
                    </div>
                </PanelSection>
                <PanelSection>
                    <div className="flex gap-2">
                        <CompactButton
                            type="submit"
                            variant="primary"
                            busy={busy}
                        >
                            {user ? 'Save changes' : 'Create account'}
                        </CompactButton>
                        <CompactButton onClick={onCancel}>Cancel</CompactButton>
                    </div>
                </PanelSection>
            </form>
        </DetailPanel>
    );
}
