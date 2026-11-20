import { Badge } from '@admin/shared/components/Badge';
import { cn } from '@admin/shared/lib/cn';
import type { TerminalState } from '@admin/features/terminals/status';

const LABEL: Record<TerminalState, string> = {
    connected: 'Connected',
    idle: 'Idle',
    never: 'Not set up',
    revoked: 'Revoked',
};

/** Connected is the only state worth colour; the rest read as quiet text so the list stays calm. */
export function TerminalStatus({
    state,
    chip = false,
}: {
    state: TerminalState;
    /** As a chip beside the panel title, rather than as list text. */
    chip?: boolean;
}) {
    if (state === 'connected' || state === 'revoked' || chip) {
        return (
            <Badge
                tone={
                    state === 'connected'
                        ? 'success'
                        : state === 'revoked'
                          ? 'danger'
                          : 'neutral'
                }
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                    (state === 'idle' || state === 'never') &&
                        'ring-1 ring-line ring-inset',
                )}
            >
                {state === 'connected' && (
                    <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-success-text"
                    />
                )}
                {LABEL[state]}
            </Badge>
        );
    }
    return <span className="text-ink-muted">{LABEL[state]}</span>;
}
