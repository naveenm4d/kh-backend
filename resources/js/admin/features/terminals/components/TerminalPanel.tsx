import { useState } from 'react';
import { Check, Copy, KeyRound, Trash2 } from 'lucide-react';
import { CompactButton } from '@admin/shared/components/controls';
import {
    DetailPanel,
    PanelFacts,
    PanelFigures,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { useToast } from '@admin/shared/components/Toast';
import { useConfirm } from '@admin/shared/hooks/useConfirm';
import { dateLabel, plural } from '@admin/shared/utils/format';
import { useDeleteTerminal } from '@admin/features/terminals/api';
import type { Terminal } from '@admin/features/terminals/api';
import { TerminalStatus } from '@admin/features/terminals/components/TerminalStatus';
import { seenLabel, terminalState } from '@admin/features/terminals/status';

/** The one-time key, right after it's created. It can't be fetched again, so it's copied from here. */
function IssuedKey({
    value,
    onDismiss,
}: {
    value: string;
    onDismiss: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
        } catch {
            toast.error('Could not copy. Select the key and copy it by hand.');
        }
    };

    return (
        <PanelSection title="Terminal key" aside="Shown only now">
            <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 py-1.5 pr-1.5 pl-3">
                <code className="min-w-0 flex-1 font-mono text-[13px] leading-5 break-all text-ink select-all">
                    {value}
                </code>
                <CompactButton
                    variant={copied ? 'secondary' : 'primary'}
                    onClick={copy}
                    className="shrink-0"
                >
                    {copied ? <Check /> : <Copy />}
                    {copied ? 'Copied' : 'Copy'}
                </CompactButton>
            </div>
            <p className="mt-2.5 text-xs text-ink-muted">
                On the till, open{' '}
                <span className="font-medium text-ink">
                    Settings → Connection
                </span>{' '}
                and paste it. If it’s lost, delete this terminal and create a
                new key.
            </p>
            <CompactButton
                variant="ghost"
                onClick={onDismiss}
                className="mt-2 -ml-3"
            >
                I’ve saved it
            </CompactButton>
        </PanelSection>
    );
}

export function TerminalPanel({
    terminal,
    issuedKey,
    onDismissKey,
    onClose,
    onDeleted,
}: {
    terminal: Terminal;
    issuedKey: string | null;
    onDismissKey: () => void;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const remove = useDeleteTerminal();
    const confirm = useConfirm();
    const toast = useToast();
    const state = terminalState(terminal);

    const handleDelete = async () => {
        const ok = await confirm({
            title: `Delete ${terminal.name}?`,
            description:
                terminal.signedIn > 0
                    ? `${plural(terminal.signedIn, 'person is', 'people are')} signed in on it and will be signed out. The till can’t connect again until it gets a new key. Past bills keep their history.`
                    : 'The till can’t connect again until it gets a new key. Past bills keep their history.',
            confirmLabel: 'Delete terminal',
            danger: true,
        });
        if (!ok) return;
        try {
            await remove.mutateAsync(terminal.id);
            toast.success(`${terminal.name} deleted`);
            onDeleted();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not delete the terminal',
            );
        }
    };

    return (
        <DetailPanel
            title={terminal.name}
            badge={<TerminalStatus state={state} chip />}
            meta={
                terminal.createdAt
                    ? `Added ${dateLabel(terminal.createdAt.slice(0, 10))}`
                    : undefined
            }
            onClose={onClose}
        >
            {issuedKey && (
                <IssuedKey value={issuedKey} onDismiss={onDismissKey} />
            )}

            {state !== 'revoked' && (
                <PanelFigures
                    items={[
                        {
                            label: 'Signed in',
                            value:
                                terminal.signedIn > 0
                                    ? plural(
                                          terminal.signedIn,
                                          'person',
                                          'people',
                                      )
                                    : 'Nobody',
                        },
                        {
                            label: 'Last seen',
                            value: seenLabel(terminal.lastSeenAt),
                        },
                    ]}
                />
            )}

            <PanelSection title="Connection">
                <PanelFacts
                    rows={[
                        {
                            label: 'Key',
                            value: (
                                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                                    <KeyRound className="size-3.5 text-ink-subtle" />
                                    {terminal.keyHint}
                                </span>
                            ),
                        },
                        {
                            label: 'Last address',
                            value: terminal.lastIp ?? '—',
                        },
                        {
                            label: 'Added',
                            value: terminal.createdAt
                                ? dateLabel(terminal.createdAt.slice(0, 10))
                                : '—',
                        },
                    ]}
                />
                {state === 'never' && !issuedKey && (
                    <p className="mt-3 text-xs text-ink-muted">
                        This till hasn’t connected yet. Its key was shown once
                        when it was created; if it’s lost, delete this terminal
                        and create a new key.
                    </p>
                )}
                {state === 'revoked' && (
                    <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-[13px] text-danger-text">
                        This key was revoked and can’t connect. Delete it to
                        clear it from the list.
                    </p>
                )}
            </PanelSection>

            <PanelSection>
                <CompactButton
                    variant="danger"
                    onClick={handleDelete}
                    busy={remove.isPending}
                >
                    <Trash2 /> Delete terminal
                </CompactButton>
            </PanelSection>
        </DetailPanel>
    );
}
