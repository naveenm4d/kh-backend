import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, History, X } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import type { BadgeTone } from '@admin/shared/components/Badge';
import {
    CompactButton,
    DateField,
    MiniSelect,
    SearchField,
} from '@admin/shared/components/controls';
import { RecordsLayout } from '@admin/shared/components/records/RecordsLayout';
import { RecordList } from '@admin/shared/components/records/RecordList';
import type { RecordColumn } from '@admin/shared/components/records/RecordList';
import { NoSelection } from '@admin/shared/components/records/DetailPanel';
import { useSelectedId } from '@admin/shared/components/records/useSelectedId';
import { PanelEmpty } from '@admin/shared/components/Panel';
import { useDebounce } from '@admin/shared/hooks/useDebounce';
import { useSearchParams } from '@admin/shared/lib/router';
import { useActivity, useActivityFilters } from '@admin/features/activity/api';
import { ActivityPanel } from '@admin/features/activity/components/ActivityPanel';
import { formatWhen } from '@admin/features/activity/format';
import type {
    ActivityEntry,
    ActivityGroup,
} from '@admin/features/activity/types';

const PAGE_SIZE = 50;

const GROUP_LABEL: Record<ActivityGroup, string> = {
    bills: 'Bills',
    customers: 'Customers',
    stock: 'Stock & prices',
    catalog: 'Catalog',
    staff: 'Staff & roles',
    settings: 'Settings & tills',
    signin: 'Sign-in',
};

const GROUP_TONE: Partial<Record<ActivityGroup, BadgeTone>> = {
    bills: 'brand',
    stock: 'warning',
    staff: 'success',
};

const COLUMNS: RecordColumn<ActivityEntry>[] = [
    {
        key: 'when',
        header: 'When',
        render: (e) => (
            <span className="text-ink-muted tabular-nums">
                {formatWhen(e.at)}
            </span>
        ),
    },
    {
        key: 'who',
        header: 'Who',
        className: 'max-w-[9rem] truncate',
        render: (e) =>
            e.actorName || <span className="text-ink-muted">Unknown</span>,
    },
    {
        key: 'what',
        header: 'Activity',
        className: 'max-w-[14rem] xl:max-w-[28rem] truncate',
        render: (e) => (
            <span
                className={
                    e.action === 'auth.sign_in_failed'
                        ? 'text-danger-text'
                        : undefined
                }
            >
                {e.summary}
            </span>
        ),
    },
    {
        key: 'group',
        header: 'Area',
        optional: 'wide',
        render: (e) => (
            <Badge
                tone={GROUP_TONE[e.group] ?? 'neutral'}
                className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-ink/10 ring-inset"
            >
                {GROUP_LABEL[e.group]}
            </Badge>
        ),
    },
    {
        key: 'where',
        header: 'Where',
        optional: true,
        render: (e) => (
            <span className="text-ink-muted">
                {e.terminalName ?? 'Console'}
            </span>
        ),
    },
];

export function ActivityPage() {
    const [params, setParams] = useSearchParams();
    const userId = params.get('user') ?? '';
    const group = (params.get('group') ?? '') as ActivityGroup | '';
    const from = params.get('from') ?? '';
    const to = params.get('to') ?? '';
    const page = Math.max(1, Number(params.get('page')) || 1);
    const [search, setSearch] = useState(() => params.get('search') ?? '');
    const debounced = useDebounce(search);
    const [selected, select] = useSelectedId();

    // Filters live in the URL; any change goes back to the first page.
    const setFilter = (name: string, value: string) =>
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                if (value) next.set(name, value);
                else next.delete(name);
                if (name !== 'page') next.delete('page');
                return next;
            },
            { replace: true },
        );

    useEffect(() => {
        if (debounced !== (params.get('search') ?? '')) {
            setFilter('search', debounced);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    const filters = useActivityFilters();
    const { data, isLoading, error } = useActivity({
        search: params.get('search') || undefined,
        userId: userId || undefined,
        group: group || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
    });
    const rows = data?.items ?? [];
    const total = data?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const filtersOn = !!search || !!userId || !!group || !!from || !!to;
    const current = rows.find((r) => r.id === selected);

    const clearAll = () => {
        setSearch('');
        setParams(
            (prev) => {
                const next = new URLSearchParams();
                const id = prev.get('id');
                if (id) next.set('id', id);
                return next;
            },
            { replace: true },
        );
    };

    return (
        <RecordsLayout
            title="Activity log"
            subtitle={
                data
                    ? `${total.toLocaleString('en-US')} entr${total === 1 ? 'y' : 'ies'}${filtersOn ? ' match these filters' : ' in the last 90 days'}`
                    : '…'
            }
            toolbar={
                <>
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder="Search activity"
                        className="w-56"
                    />
                    <MiniSelect
                        aria-label="Person"
                        value={userId}
                        onChange={(v) => setFilter('user', v)}
                        className="w-44"
                        options={[
                            { value: '', label: 'Anyone' },
                            ...(filters.data?.actors ?? []).map((a) => ({
                                value: a.id,
                                label: a.name,
                            })),
                        ]}
                    />
                    <MiniSelect
                        aria-label="Area"
                        value={group}
                        onChange={(v) => setFilter('group', v)}
                        className="w-40"
                        options={[
                            { value: '' as const, label: 'All areas' },
                            ...(filters.data?.groups ?? []).map((g) => ({
                                value: g.key,
                                label: g.label,
                            })),
                        ]}
                    />
                    <DateField
                        aria-label="From"
                        placeholder="From"
                        value={from}
                        onChange={(e) => setFilter('from', e.target.value)}
                    />
                    <DateField
                        aria-label="To"
                        placeholder="To"
                        value={to}
                        onChange={(e) => setFilter('to', e.target.value)}
                    />
                    {filtersOn && (
                        <CompactButton variant="ghost" onClick={clearAll}>
                            <X /> Clear filters
                        </CompactButton>
                    )}
                </>
            }
            list={
                <RecordList
                    label="Activity"
                    columns={COLUMNS}
                    rows={rows}
                    rowKey={(e) => e.id}
                    selected={selected}
                    onSelect={select}
                    isLoading={isLoading}
                    empty={
                        <PanelEmpty
                            icon={<History className="size-6" />}
                            title={
                                error
                                    ? "Couldn't load the activity log"
                                    : filtersOn
                                      ? 'No activity matches these filters'
                                      : 'No activity yet'
                            }
                            description={
                                error
                                    ? error.message
                                    : filtersOn
                                      ? 'Try another person, area or date, or clear the filters.'
                                      : 'Changes to bills, stock, prices, staff and settings appear here, along with sign-ins.'
                            }
                        />
                    }
                    footer={
                        total > PAGE_SIZE ? (
                            <div className="flex items-center justify-between px-5 py-2 text-[13px] text-ink-muted tabular-nums">
                                <span>
                                    {(page - 1) * PAGE_SIZE + 1}–
                                    {Math.min(total, page * PAGE_SIZE)} of{' '}
                                    {total.toLocaleString('en-US')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CompactButton
                                        aria-label="Previous page"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setFilter('page', String(page - 1))
                                        }
                                        className="px-2"
                                    >
                                        <ChevronLeft />
                                    </CompactButton>
                                    <span className="px-1">
                                        Page {page} of {pages}
                                    </span>
                                    <CompactButton
                                        aria-label="Next page"
                                        disabled={page >= pages}
                                        onClick={() =>
                                            setFilter('page', String(page + 1))
                                        }
                                        className="px-2"
                                    >
                                        <ChevronRight />
                                    </CompactButton>
                                </span>
                            </div>
                        ) : undefined
                    }
                />
            }
            panel={
                current ? (
                    <ActivityPanel
                        key={current.id}
                        entry={current}
                        onClose={() => select(null)}
                    />
                ) : (
                    <NoSelection noun="an entry" />
                )
            }
        />
    );
}
