import { useState } from 'react';
import { CompactButton, CompactInput } from '@admin/shared/components/controls';
import {
    DetailPanel,
    PanelSection,
} from '@admin/shared/components/records/DetailPanel';
import { useToast } from '@admin/shared/components/Toast';
import { useRegisterTerminal } from '@admin/features/terminals/api';
import type { Terminal } from '@admin/features/terminals/api';

/** Names a new till. Its key appears in the terminal's own panel once it's created. */
export function NewTerminalPanel({
    existing,
    onCancel,
    onCreated,
}: {
    existing: Terminal[];
    onCancel: () => void;
    onCreated: (terminal: Terminal, key: string) => void;
}) {
    const [name, setName] = useState('');
    const register = useRegisterTerminal();
    const toast = useToast();
    const trimmed = name.trim();
    const taken = existing.some(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    );

    const submit = async () => {
        if (!trimmed || taken) return;
        try {
            const { key, ...terminal } = await register.mutateAsync(trimmed);
            onCreated(terminal, key);
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not create the key',
            );
        }
    };

    return (
        <DetailPanel
            title="New terminal"
            meta="One key for each counter computer."
            onClose={onCancel}
        >
            <PanelSection>
                <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void submit();
                    }}
                >
                    <label
                        htmlFor="terminal-name"
                        className="text-xs font-medium text-ink-muted"
                    >
                        Name
                    </label>
                    <CompactInput
                        id="terminal-name"
                        autoFocus
                        autoComplete="off"
                        placeholder="e.g. Counter 2"
                        maxLength={60}
                        value={name}
                        invalid={taken}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <span
                        className={
                            taken
                                ? 'text-xs text-danger-text'
                                : 'text-xs text-ink-muted'
                        }
                    >
                        {taken
                            ? `There’s already a terminal called ${trimmed}.`
                            : 'Name it after where it sits, so staff can tell tills apart.'}
                    </span>
                    <div className="mt-2 flex gap-2">
                        <CompactButton
                            type="submit"
                            variant="primary"
                            disabled={!trimmed || taken}
                            busy={register.isPending}
                        >
                            Create key
                        </CompactButton>
                        <CompactButton onClick={onCancel}>Cancel</CompactButton>
                    </div>
                </form>
            </PanelSection>
        </DetailPanel>
    );
}
