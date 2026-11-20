import { useEffect, useState } from 'react';
import { useSearchParams } from '@admin/shared/lib/router';
import { Plus, ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { Card } from '@admin/shared/components/Card';
import {
    CompactButton,
    SearchField,
    Segmented,
} from '@admin/shared/components/controls';
import { RecordsLayout } from '@admin/shared/components/records/RecordsLayout';
import { RecordList } from '@admin/shared/components/records/RecordList';
import type { RecordColumn } from '@admin/shared/components/records/RecordList';
import { NoSelection } from '@admin/shared/components/records/DetailPanel';
import { useSelectedId } from '@admin/shared/components/records/useSelectedId';
import { PanelEmpty } from '@admin/shared/components/Panel';
import { cn } from '@admin/shared/lib/cn';
import { plural } from '@admin/shared/utils/format';
import { useCurrentUser } from '@admin/features/auth/hooks';
import { CustomerAvatar } from '@admin/features/customers/components/CustomerAvatar';
import {
    usePermissionCatalog,
    useRoles,
    useStaffUsers,
} from '@admin/features/users/hooks';
import { StaffPanel } from '@admin/features/users/components/StaffPanel';
import { StaffForm } from '@admin/features/users/components/StaffForm';
import { RolePanel } from '@admin/features/users/components/RolePanel';
import type { Role, StaffUser } from '@admin/features/users/types';

type Tab = 'staff' | 'roles';
const NEW = 'new';

export function UsersPage() {
    const [params, setParams] = useSearchParams();
    const tab: Tab = params.get('tab') === 'roles' ? 'roles' : 'staff';
    const [selected, select] = useSelectedId();
    const [editing, setEditing] = useState(false);
    const [search, setSearch] = useState('');
    const me = useCurrentUser();
    const { data: users = [], isLoading: loadingUsers } = useStaffUsers();
    const { data: roles = [], isLoading: loadingRoles } = useRoles();
    const { data: catalog = [] } = usePermissionCatalog();

    useEffect(() => setEditing(false), [selected, tab]);

    const roleById = new Map(roles.map((r) => [r.id, r]));
    const membersOf = (id: string) => users.filter((u) => u.role === id);
    const go = (t: Tab, id?: string) =>
        setParams(id ? { tab: t, id } : { tab: t }, { replace: true });
    const q = search.trim().toLowerCase();
    const deactivated = users.filter((u) => !u.active).length;

    const staffColumns: RecordColumn<StaffUser>[] = [
        {
            key: 'name',
            header: 'Name',
            render: (u) => (
                <span className="flex min-w-0 items-center gap-2.5">
                    <CustomerAvatar
                        mono
                        name={u.name}
                        className={cn(
                            'size-6 text-[10px] font-semibold',
                            !u.active && 'opacity-50',
                        )}
                    />
                    <span
                        className={cn(
                            'truncate font-medium',
                            !u.active && 'text-ink-muted',
                        )}
                    >
                        {u.name}
                    </span>
                    {u.id === me?.id && (
                        <span className="text-xs text-ink-muted">(you)</span>
                    )}
                </span>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            render: (u) => (
                <span className="text-ink-muted tabular-nums">
                    {u.code || '—'}
                </span>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            optional: 'wide',
            render: (u) => <span className="text-ink-muted">{u.email}</span>,
        },
        {
            key: 'role',
            header: 'Role',
            render: (u) => (
                <span className={u.active ? 'text-ink' : 'text-ink-muted'}>
                    {roleById.get(u.role)?.name ?? u.role}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (u) =>
                u.active ? (
                    <span className="text-ink-muted">Active</span>
                ) : (
                    <Badge
                        tone="neutral"
                        className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-line ring-inset"
                    >
                        Deactivated
                    </Badge>
                ),
        },
    ];
    const roleColumns: RecordColumn<Role>[] = [
        {
            key: 'name',
            header: 'Role',
            render: (r) => (
                <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{r.name}</span>
                    {r.locked && (
                        <ShieldCheck
                            className="size-3.5 shrink-0 text-ink-subtle"
                            aria-label="Full access"
                        />
                    )}
                </span>
            ),
        },
        {
            key: 'desc',
            header: 'For',
            optional: 'wide',
            className: 'max-w-[260px] truncate',
            render: (r) => (
                <span className="text-ink-muted">{r.description || '—'}</span>
            ),
        },
        {
            key: 'staff',
            header: 'Staff',
            align: 'right',
            render: (r) => (
                <span className="text-ink-muted tabular-nums">
                    {membersOf(r.id).length}
                </span>
            ),
        },
        {
            key: 'perms',
            header: 'Permissions',
            align: 'right',
            render: (r) => (
                <span className="text-ink-muted tabular-nums">
                    {r.locked
                        ? 'All'
                        : `${r.permissions.length} of ${catalog.length}`}
                </span>
            ),
        },
    ];

    let panel: React.ReactNode;
    if (tab === 'staff') {
        const user = users.find((u) => u.id === selected);
        if (selected === NEW || (user && editing)) {
            panel = (
                <StaffForm
                    key={selected}
                    user={selected === NEW ? null : (user ?? null)}
                    roles={roles}
                    others={users}
                    onCancel={() =>
                        selected === NEW ? select(null) : setEditing(false)
                    }
                    onDone={(u) => {
                        setEditing(false);
                        select(u.id);
                    }}
                />
            );
        } else if (user) {
            panel = (
                <StaffPanel
                    key={user.id}
                    user={user}
                    role={roleById.get(user.role)}
                    catalog={catalog}
                    onClose={() => select(null)}
                    onEdit={() => setEditing(true)}
                    onOpenRole={(id) => go('roles', id)}
                    onDeleted={() => select(null)}
                />
            );
        }
    } else {
        const role = roles.find((r) => r.id === selected);
        if (selected === NEW || role) {
            panel = (
                <RolePanel
                    key={`${selected}-${role?.permissions.join()}-${role?.name}`}
                    role={role ?? null}
                    roles={roles}
                    members={role ? membersOf(role.id) : []}
                    catalog={catalog}
                    onClose={() => select(null)}
                    onSaved={(r) => select(r.id)}
                    onDeleted={() => select(null)}
                    onOpenUser={(id) => go('staff', id)}
                />
            );
        }
    }
    if (!panel) {
        panel =
            selected && !loadingUsers && !loadingRoles ? (
                <Card className="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-ink-muted">
                    That record couldn't be found. It may have been deleted.
                </Card>
            ) : (
                <NoSelection
                    noun={tab === 'staff' ? 'a staff member' : 'a role'}
                    hint={
                        tab === 'roles'
                            ? 'Each role is a set of permissions; everyone with the role gets them.'
                            : undefined
                    }
                />
            );
    }

    return (
        <RecordsLayout
            title="Users & roles"
            subtitle={`${plural(users.length - deactivated, 'active account')}${deactivated ? ` · ${deactivated} deactivated` : ''} · ${plural(roles.length, 'role')}`}
            actions={
                <CompactButton variant="primary" onClick={() => select(NEW)}>
                    <Plus />{' '}
                    {tab === 'staff' ? 'New staff account' : 'New role'}
                </CompactButton>
            }
            toolbar={
                <>
                    <Segmented
                        label="Section"
                        value={tab}
                        onChange={(t) => {
                            setSearch('');
                            go(t);
                        }}
                        options={[
                            {
                                value: 'staff',
                                label: `Staff (${users.length})`,
                            },
                            {
                                value: 'roles',
                                label: `Roles (${roles.length})`,
                            },
                        ]}
                    />
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={
                            tab === 'staff'
                                ? 'Search name, code or email'
                                : 'Search roles'
                        }
                        className="w-64"
                    />
                </>
            }
            list={
                tab === 'staff' ? (
                    <RecordList
                        label="Staff"
                        columns={staffColumns}
                        rows={users.filter(
                            (u) =>
                                !q ||
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                u.code.includes(q),
                        )}
                        rowKey={(u) => u.id}
                        selected={selected}
                        onSelect={select}
                        isLoading={loadingUsers}
                        rowTone={(u) => (u.active ? undefined : 'muted')}
                        empty={
                            <PanelEmpty
                                icon={<UserRound className="size-6" />}
                                title={
                                    q
                                        ? `No staff match "${search}"`
                                        : 'No staff accounts'
                                }
                            />
                        }
                    />
                ) : (
                    <RecordList
                        label="Roles"
                        columns={roleColumns}
                        rows={roles.filter(
                            (r) => !q || r.name.toLowerCase().includes(q),
                        )}
                        rowKey={(r) => r.id}
                        selected={selected}
                        onSelect={select}
                        isLoading={loadingRoles}
                        empty={
                            <PanelEmpty
                                icon={<ShieldCheck className="size-6" />}
                                title={`No roles match "${search}"`}
                            />
                        }
                    />
                )
            }
            panel={panel}
        />
    );
}
