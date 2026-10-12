import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { MonitorSmartphone, Plus } from 'lucide-react';
import { Card } from '@admin/shared/components/Card';
import { CompactButton } from '@admin/shared/components/controls';
import { PanelEmpty } from '@admin/shared/components/Panel';
import { NoSelection } from '@admin/shared/components/records/DetailPanel';
import { RecordList } from '@admin/shared/components/records/RecordList';
import type { RecordColumn } from '@admin/shared/components/records/RecordList';
import { RecordsLayout } from '@admin/shared/components/records/RecordsLayout';
import { useSelectedId } from '@admin/shared/components/records/useSelectedId';
import { cn } from '@admin/shared/lib/cn';
import { plural } from '@admin/shared/utils/format';
import { useTerminals } from '@admin/features/terminals/api';
import type { Terminal } from '@admin/features/terminals/api';
import { NewTerminalPanel } from '@admin/features/terminals/components/NewTerminalPanel';
import { TerminalPanel } from '@admin/features/terminals/components/TerminalPanel';
import { TerminalStatus } from '@admin/features/terminals/components/TerminalStatus';
import { seenLabel, terminalState } from '@admin/features/terminals/status';

const NEW = 'new';

/**
 * The counter computers allowed to run the cashier app, each with its own key. Keys are created
 * here, shown once in the new terminal's panel, and deleted when a till is retired or its key lost.
 */
export function TerminalsPage() {
    const { data: terminals = [], isLoading } = useTerminals();
    const [selected, select] = useSelectedId();
    const [issued, setIssued] = useState<{ id: string; key: string } | null>(
        null,
    );
    // Tick every half minute so "Connected" and "12 min ago" stay true while the page is open.
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(t);
    }, []);

    // The key is a one-time secret: once the owner moves to another record, it's gone.
    const choose = (id: string | null) => {
        if (issued && id !== issued.id) setIssued(null);
        select(id);
    };

    const connected = terminals.filter(
        (t) => terminalState(t, now) === 'connected',
    ).length;

    const columns: RecordColumn<Terminal>[] = [
        {
            key: 'name',
            header: 'Terminal',
            render: (t) => (
                <span className="flex min-w-0 items-center gap-2.5">
                    <MonitorSmartphone
                        className={cn(
                            'size-4 shrink-0',
                            terminalState(t, now) === 'connected'
                                ? 'text-brand-600'
                                : 'text-ink-subtle',
                        )}
                    />
                    <span className="truncate font-medium">{t.name}</span>
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (t) => <TerminalStatus state={terminalState(t, now)} />,
        },
        {
            key: 'seen',
            header: 'Last seen',
            render: (t) => (
                <span className="text-ink-muted tabular-nums">
                    {t.revokedAt ? '—' : seenLabel(t.lastSeenAt, now)}
                </span>
            ),
        },
        {
            key: 'key',
            header: 'Key',
            optional: 'wide',
            render: (t) => (
                <span className="font-mono text-xs text-ink-muted">
                    {t.keyHint}
                </span>
            ),
        },
        {
            key: 'signedIn',
            header: 'Signed in',
            align: 'right',
            render: (t) => (
                <span
                    className={cn(
                        'tabular-nums',
                        t.signedIn > 0
                            ? 'font-semibold text-ink'
                            : 'text-ink-muted',
                    )}
                >
                    {t.signedIn}
                </span>
            ),
        },
    ];

    const terminal = terminals.find((t) => t.id === selected);
    let panel: ReactNode;
    if (selected === NEW) {
        panel = (
            <NewTerminalPanel
                existing={terminals}
                onCancel={() => choose(null)}
                onCreated={(t, key) => {
                    setIssued({ id: t.id, key });
                    select(t.id);
                }}
            />
        );
    } else if (terminal) {
        panel = (
            <TerminalPanel
                key={terminal.id}
                terminal={terminal}
                issuedKey={issued?.id === terminal.id ? issued.key : null}
                onDismissKey={() => setIssued(null)}
                onClose={() => choose(null)}
                onDeleted={() => choose(null)}
            />
        );
    } else if (selected && !isLoading && issued?.id !== selected) {
        panel = (
            <Card className="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-ink-muted">
                That terminal couldn’t be found. It may have been deleted.
            </Card>
        );
    } else {
        panel = (
            <NoSelection
                noun="a terminal"
                hint="Each counter computer needs its own key to run the cashier app."
            />
        );
    }

    return (
        <RecordsLayout
            title="Terminals"
            subtitle={
                isLoading
                    ? 'Loading…'
                    : `${plural(terminals.length, 'terminal')} · ${connected} connected now`
            }
            actions={
                <CompactButton variant="primary" onClick={() => choose(NEW)}>
                    <Plus /> New terminal key
                </CompactButton>
            }
            list={
                <RecordList
                    label="Terminals"
                    columns={columns}
                    rows={terminals}
                    rowKey={(t) => t.id}
                    selected={selected}
                    onSelect={choose}
                    isLoading={isLoading}
                    rowTone={(t) => (t.revokedAt ? 'muted' : undefined)}
                    empty={
                        <PanelEmpty
                            icon={<MonitorSmartphone className="size-6" />}
                            title="No terminals yet"
                            description="Create a key for each counter computer that runs the cashier app."
                        />
                    }
                />
            }
            panel={panel}
        />
    );
}
