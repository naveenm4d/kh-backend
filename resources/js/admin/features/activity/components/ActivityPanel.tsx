import { ArrowRight } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import {
    DetailPanel,
    PanelFacts,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { Link } from '@admin/shared/lib/router';
import type {
    ActivityChange,
    ActivityEntry,
} from '@admin/features/activity/types';
import { formatDateTime } from '@admin/features/activity/format';

/** Where the record an entry is about can be opened, if it has a page. */
function subjectHref(entry: ActivityEntry): string | null {
    if (!entry.subjectId) return null;
    switch (entry.subjectType) {
        case 'order':
            return `/admin/orders?id=${encodeURIComponent(entry.subjectLabel)}`;
        case 'customer':
            return `/admin/customers?id=${entry.subjectId}`;
        case 'product':
            return `/admin/inventory?id=${entry.subjectId}`;
        default:
            return null;
    }
}

function show(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toLocaleString('en-US');
    return JSON.stringify(value);
}

function Changes({ changes }: { changes: ActivityChange[] }) {
    return (
        <ul className="flex flex-col gap-3 text-[13px]">
            {changes.map((c) => (
                <li key={c.field} className="min-w-0">
                    <div className="text-xs text-ink-muted">{c.label}</div>
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
                        <span className="break-words text-ink-muted line-through decoration-ink/30">
                            {show(c.from)}
                        </span>
                        <ArrowRight className="size-3 shrink-0 self-center text-ink-subtle" />
                        <span className="font-medium break-words text-ink">
                            {show(c.to)}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function ActivityPanel({
    entry,
    onClose,
}: {
    entry: ActivityEntry;
    onClose: () => void;
}) {
    const href = subjectHref(entry);

    return (
        <DetailPanel
            title={entry.actionLabel}
            meta={formatDateTime(entry.at)}
            badge={
                entry.action === 'auth.sign_in_failed' ? (
                    <Badge tone="danger">Failed</Badge>
                ) : undefined
            }
            onClose={onClose}
        >
            <PanelSection>
                <p className="text-[13px] text-ink">{entry.summary}</p>
            </PanelSection>
            <PanelSection title="Details">
                <PanelFacts
                    rows={[
                        {
                            label: 'By',
                            value: entry.actorName || 'Nobody signed in',
                        },
                        {
                            label: 'Where',
                            value: entry.terminalName
                                ? `Till: ${entry.terminalName}`
                                : 'Admin console',
                        },
                        { label: 'IP address', value: entry.ip || '—' },
                        ...(entry.subjectLabel
                            ? [
                                  {
                                      label: 'Record',
                                      value: href ? (
                                          <Link
                                              to={href}
                                              className="font-medium text-brand-700 hover:underline"
                                          >
                                              {entry.subjectLabel}
                                          </Link>
                                      ) : (
                                          entry.subjectLabel
                                      ),
                                  },
                              ]
                            : []),
                    ]}
                />
            </PanelSection>
            {entry.changes.length > 0 && (
                <PanelSection title="What changed">
                    <Changes changes={entry.changes} />
                </PanelSection>
            )}
        </DetailPanel>
    );
}
