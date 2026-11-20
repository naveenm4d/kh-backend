import type { Terminal } from '@admin/features/terminals/api';
import { dateLabel } from '@admin/shared/utils/format';

/** A till pings on every request (recorded at most once a minute), so 5 minutes means it's up. */
const CONNECTED_MS = 5 * 60_000;

export type TerminalState = 'connected' | 'idle' | 'never' | 'revoked';

export function terminalState(t: Terminal, now = Date.now()): TerminalState {
    if (t.revokedAt) return 'revoked';
    if (!t.lastSeenAt) return 'never';
    return now - new Date(t.lastSeenAt).getTime() < CONNECTED_MS
        ? 'connected'
        : 'idle';
}

/** "Just now", "12 min ago", "3 h ago", "8 Oct, 14:05". */
export function seenLabel(iso: string | null, now = Date.now()): string {
    if (!iso) return 'Never';
    const mins = Math.floor((now - new Date(iso).getTime()) / 60_000);
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    if (mins < 12 * 60) return `${Math.floor(mins / 60)} h ago`;
    const time = new Date(iso).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });
    return `${dateLabel(iso.slice(0, 10))}, ${time}`;
}
