import { useMemo, useState } from 'react';
import { Lock, Trash2 } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
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
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { CustomerAvatar } from '@admin/features/customers/components/CustomerAvatar';
import { Field } from '@admin/features/users/components/Field';
import { PermissionChecklist } from '@admin/features/users/components/PermissionChecklist';
import {
    useCreateRole,
    useDeleteRole,
    useUpdateRole,
} from '@admin/features/users/hooks';
import type {
    Permission,
    PermissionInfo,
    Role,
    StaffUser,
} from '@admin/features/users/types';

/** View and edit a role in place (role = null creates one). Save/Discard appear once something changes. */
export function RolePanel({
    role,
    roles,
    members,
    catalog,
    onClose,
    onSaved,
    onDeleted,
    onOpenUser,
}: {
    role: Role | null;
    roles: Role[];
    members: StaffUser[];
    catalog: PermissionInfo[];
    onClose: () => void;
    onSaved: (r: Role) => void;
    onDeleted: () => void;
    onOpenUser: (id: string) => void;
}) {
    const [name, setName] = useState(role?.name ?? '');
    const [description, setDescription] = useState(role?.description ?? '');
    const [perms, setPerms] = useState<Permission[]>(
        role?.permissions ?? ['pos.access'],
    );
    const [submitted, setSubmitted] = useState(false);
    const create = useCreateRole();
    const update = useUpdateRole();
    const remove = useDeleteRole();
    const confirm = useConfirm();
    const toast = useToast();

    const dirty = useMemo(() => {
        if (!role) return true;
        const a = [...perms].sort().join();
        const b = [...role.permissions].sort().join();
        return (
            name.trim() !== role.name ||
            description.trim() !== role.description ||
            a !== b
        );
    }, [role, name, description, perms]);
    const nameError = !name.trim()
        ? 'Give the role a name'
        : roles.some(
                (r) =>
                    r.id !== role?.id &&
                    r.name.toLowerCase() === name.trim().toLowerCase(),
            )
          ? 'Another role has this name'
          : null;
    const noAccess =
        !perms.includes('pos.access') &&
        !perms.some((p) => p.startsWith('page.'));

    const save = async () => {
        setSubmitted(true);
        if (nameError) return;
        const input = {
            name: name.trim(),
            description: description.trim(),
            permissions: perms,
        };
        try {
            const saved = role
                ? await update.mutateAsync({ id: role.id, input })
                : await create.mutateAsync(input);
            toast.success(
                role
                    ? `${saved.name} updated. Takes effect right away`
                    : `${saved.name} role created`,
            );
            onSaved(saved);
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not save the role',
            );
        }
    };

    const discard = () => {
        if (!role) return onClose();
        setName(role.name);
        setDescription(role.description);
        setPerms(role.permissions);
        setSubmitted(false);
    };

    const handleDelete = async () => {
        if (!role) return;
        const ok = await confirm({
            title: `Delete the ${role.name} role?`,
            description: 'This cannot be undone.',
            confirmLabel: 'Delete role',
            danger: true,
        });
        if (!ok) return;
        try {
            await remove.mutateAsync(role.id);
            toast.success(`${role.name} deleted`);
            onDeleted();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not delete the role',
            );
        }
    };

    return (
        <DetailPanel
            title={role ? role.name : 'New role'}
            meta={
                role
                    ? `${members.length} staff · ${role.permissions.length} of ${catalog.length} permissions`
                    : 'Pick what people with this role can do.'
            }
            badge={
                role?.system ? (
                    <Badge
                        tone="neutral"
                        className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-line ring-inset"
                    >
                        Built-in
                    </Badge>
                ) : null
            }
            onClose={onClose}
        >
            <form
                className="flex min-h-full flex-col"
                onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                }}
            >
                <PanelSection>
                    <div className="flex flex-col gap-3">
                        <Field
                            label="Name"
                            error={submitted ? nameError : null}
                        >
                            <CompactInput
                                autoFocus={!role}
                                value={name}
                                invalid={submitted && !!nameError}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Storekeeper"
                            />
                        </Field>
                        <Field label="Description (optional)">
                            <CompactInput
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Who this role is for"
                            />
                        </Field>
                        {!role && (
                            <Field label="Start from">
                                <MiniSelect
                                    aria-label="Copy permissions from"
                                    value=""
                                    onChange={(id) => {
                                        const src = roles.find(
                                            (r) => r.id === id,
                                        );
                                        if (src) setPerms(src.permissions);
                                    }}
                                    options={[
                                        {
                                            value: '',
                                            label: 'Choose a role to copy…',
                                        },
                                        ...roles.map((r) => ({
                                            value: r.id,
                                            label: `Copy ${r.name}`,
                                        })),
                                    ]}
                                />
                            </Field>
                        )}
                    </div>
                </PanelSection>

                <PanelSection
                    title="Permissions"
                    aside={`${perms.length} of ${catalog.length}`}
                >
                    {role?.locked && (
                        <div className="mb-3 flex items-start gap-2 rounded-lg bg-canvas px-3 py-2 text-[13px] text-ink-muted">
                            <Lock className="mt-0.5 size-3.5 shrink-0" />
                            {role.name} always has every permission, so there's
                            always someone who can manage the shop.
                        </div>
                    )}
                    {noAccess && !role?.locked && (
                        <div className="mb-3 rounded-lg bg-warning-bg px-3 py-2 text-[13px] text-warning-text">
                            With no page and no cashier screen, people with this
                            role can sign in but won't see anything.
                        </div>
                    )}
                    <PermissionChecklist
                        catalog={catalog}
                        value={role?.locked ? catalog.map((p) => p.key) : perms}
                        onChange={setPerms}
                        disabled={role?.locked}
                    />
                </PanelSection>

                {role && (
                    <PanelSection
                        title="Staff with this role"
                        aside={members.length ? undefined : 'None'}
                    >
                        {members.length > 0 && (
                            <ul className="-mx-2">
                                {members.map((m) => (
                                    <li key={m.id}>
                                        <button
                                            type="button"
                                            onClick={() => onOpenUser(m.id)}
                                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-canvas/70"
                                        >
                                            <CustomerAvatar
                                                mono
                                                name={m.name}
                                                className="size-6 text-[10px] font-semibold"
                                            />
                                            <span className="flex-1 truncate text-ink">
                                                {m.name}
                                            </span>
                                            {!m.active && (
                                                <span className="text-xs text-ink-muted">
                                                    Deactivated
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </PanelSection>
                )}

                {role && !role.system && (
                    <PanelSection>
                        <CompactButton
                            variant="danger"
                            onClick={handleDelete}
                            busy={remove.isPending}
                            disabled={members.length > 0}
                            title={
                                members.length
                                    ? 'Move its staff to another role first'
                                    : undefined
                            }
                        >
                            <Trash2 /> Delete role
                        </CompactButton>
                        {members.length > 0 && (
                            <p className="mt-2 text-xs text-ink-muted">
                                Move its {members.length} staff to another role
                                before deleting it.
                            </p>
                        )}
                    </PanelSection>
                )}

                {dirty && !role?.locked ? (
                    <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-line bg-canvas-card/95 px-5 py-3 backdrop-blur-sm">
                        <CompactButton
                            type="submit"
                            variant="primary"
                            busy={create.isPending || update.isPending}
                        >
                            {role ? 'Save changes' : 'Create role'}
                        </CompactButton>
                        <CompactButton onClick={discard}>
                            {role ? 'Discard' : 'Cancel'}
                        </CompactButton>
                        {role && members.length > 0 && (
                            <span className="ml-auto text-xs text-ink-muted">
                                Applies to {members.length} staff
                            </span>
                        )}
                    </div>
                ) : role?.locked && dirty ? (
                    <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-line bg-canvas-card/95 px-5 py-3 backdrop-blur-sm">
                        <CompactButton
                            type="submit"
                            variant="primary"
                            busy={update.isPending}
                        >
                            Save name & description
                        </CompactButton>
                        <CompactButton onClick={discard}>Discard</CompactButton>
                    </div>
                ) : null}
            </form>
        </DetailPanel>
    );
}
