import { useState } from 'react';
import { Check, KeyRound, Pencil, Power, Trash2 } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { CompactButton, CompactInput } from '@admin/shared/components/controls';
import {
    DetailPanel,
    PanelFacts,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { useToast } from '@admin/shared/components/Toast';
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { useCurrentUser } from '@admin/features/auth/hooks';
import {
    useDeleteStaffUser,
    useResetPassword,
    useUpdateStaffUser,
} from '@admin/features/users/hooks';
import type {
    PermissionInfo,
    Role,
    StaffUser,
} from '@admin/features/users/types';

function ResetPassword({
    user,
    onDone,
}: {
    user: StaffUser;
    onDone: () => void;
}) {
    const [pw, setPw] = useState('');
    const reset = useResetPassword();
    const toast = useToast();
    const short = pw.length > 0 && pw.length < 6;
    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={async (e) => {
                e.preventDefault();
                if (pw.length < 6) return;
                try {
                    await reset.mutateAsync({ id: user.id, password: pw });
                    toast.success(`${user.name}'s password was changed`);
                    onDone();
                } catch (err) {
                    toast.error(
                        (err as { message?: string })?.message ??
                            'Could not change the password',
                    );
                }
            }}
        >
            <CompactInput
                autoFocus
                type="password"
                aria-label="New password"
                placeholder="New password"
                autoComplete="new-password"
                value={pw}
                invalid={short}
                onChange={(e) => setPw(e.target.value)}
            />
            <span
                className={
                    short
                        ? 'text-xs text-danger-text'
                        : 'text-xs text-ink-muted'
                }
            >
                {short
                    ? 'At least 6 characters'
                    : `${user.name.split(' ')[0]} signs in with the new password from now on.`}
            </span>
            <div className="flex gap-2">
                <CompactButton
                    type="submit"
                    variant="primary"
                    disabled={pw.length < 6}
                    busy={reset.isPending}
                >
                    Set password
                </CompactButton>
                <CompactButton onClick={onDone}>Cancel</CompactButton>
            </div>
        </form>
    );
}

/** Read-only list of granted permissions: ink rows with a drawn check, grouped like the editor. */
function GrantedList({ items }: { items: PermissionInfo[] }) {
    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((p) => (
                <li key={p.key} className="flex items-start gap-2 text-[13px]">
                    <Check
                        className="mt-0.5 size-3.5 shrink-0 text-brand-600"
                        strokeWidth={2.5}
                    />
                    <span className="text-ink">{p.label}</span>
                </li>
            ))}
        </ul>
    );
}

export function StaffPanel({
    user,
    role,
    catalog,
    onClose,
    onEdit,
    onOpenRole,
    onDeleted,
}: {
    user: StaffUser;
    role: Role | undefined;
    catalog: PermissionInfo[];
    onClose: () => void;
    onEdit: () => void;
    onOpenRole: (id: string) => void;
    onDeleted: () => void;
}) {
    const me = useCurrentUser();
    const self = me?.id === user.id;
    const [resetting, setResetting] = useState(false);
    const update = useUpdateStaffUser();
    const remove = useDeleteStaffUser();
    const confirm = useConfirm();
    const toast = useToast();

    const setActive = async (active: boolean) => {
        if (!active) {
            const ok = await confirm({
                title: `Deactivate ${user.name}?`,
                description:
                    "They won't be able to sign in. Their bills and history stay. You can reactivate them any time.",
                confirmLabel: 'Deactivate',
                danger: true,
            });
            if (!ok) return;
        }
        try {
            await update.mutateAsync({
                id: user.id,
                input: {
                    name: user.name,
                    code: user.code,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    active,
                },
            });
            toast.success(
                active
                    ? `${user.name} can sign in again`
                    : `${user.name} is deactivated`,
            );
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not update the account',
            );
        }
    };

    const handleDelete = async () => {
        const ok = await confirm({
            title: `Delete ${user.name}?`,
            description:
                'Their bills keep the cashier name, but the account is gone for good. To stop someone signing in but keep the account, deactivate it instead.',
            confirmLabel: 'Delete account',
            danger: true,
        });
        if (!ok) return;
        try {
            await remove.mutateAsync(user.id);
            toast.success(`${user.name} deleted`);
            onDeleted();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not delete the account',
            );
        }
    };

    return (
        <DetailPanel
            title={user.name}
            meta={[user.code && `Code ${user.code}`, user.email, user.phone]
                .filter(Boolean)
                .join(' · ')}
            badge={
                <>
                    {self && (
                        <Badge
                            tone="brand"
                            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                        >
                            You
                        </Badge>
                    )}
                    {!user.active && (
                        <Badge
                            tone="neutral"
                            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-line ring-inset"
                        >
                            Deactivated
                        </Badge>
                    )}
                </>
            }
            onClose={onClose}
            actions={
                <>
                    <CompactButton onClick={onEdit}>
                        <Pencil /> Edit
                    </CompactButton>
                    {!resetting && (
                        <CompactButton onClick={() => setResetting(true)}>
                            <KeyRound /> Reset password
                        </CompactButton>
                    )}
                    {!self && (
                        <CompactButton
                            onClick={() => setActive(!user.active)}
                            busy={update.isPending}
                        >
                            <Power />{' '}
                            {user.active ? 'Deactivate' : 'Reactivate'}
                        </CompactButton>
                    )}
                </>
            }
        >
            {resetting && (
                <PanelSection title="Reset password">
                    <ResetPassword
                        user={user}
                        onDone={() => setResetting(false)}
                    />
                </PanelSection>
            )}

            <PanelSection title="Access">
                <PanelFacts
                    rows={[
                        {
                            label: 'Role',
                            value: role ? (
                                <button
                                    type="button"
                                    onClick={() => onOpenRole(role.id)}
                                    className="cursor-pointer text-brand-600 underline-offset-2 hover:underline"
                                >
                                    {role.name}
                                </button>
                            ) : (
                                '—'
                            ),
                        },
                        {
                            label: 'Permissions',
                            value: role
                                ? role.locked
                                    ? 'All'
                                    : `${role.permissions.length} of ${catalog.length}`
                                : '—',
                        },
                    ]}
                />
                {role && catalog.length > 0 && (
                    <div className="mt-3.5 border-t border-line/70 pt-3.5">
                        <GrantedList
                            items={catalog.filter((p) =>
                                role.permissions.includes(p.key),
                            )}
                        />
                        {!role.locked && (
                            <p className="mt-3 text-xs text-ink-muted">
                                Change these on the{' '}
                                <button
                                    type="button"
                                    onClick={() => onOpenRole(role.id)}
                                    className="cursor-pointer text-brand-600 underline-offset-2 hover:underline"
                                >
                                    {role.name} role
                                </button>
                                . It applies to everyone with that role.
                            </p>
                        )}
                    </div>
                )}
            </PanelSection>

            {!self && (
                <PanelSection>
                    <CompactButton
                        variant="danger"
                        onClick={handleDelete}
                        busy={remove.isPending}
                    >
                        <Trash2 /> Delete account
                    </CompactButton>
                </PanelSection>
            )}
        </DetailPanel>
    );
}
