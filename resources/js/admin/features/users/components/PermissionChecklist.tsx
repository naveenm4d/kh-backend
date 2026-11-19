import { Check } from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';
import type { Permission, PermissionInfo } from '@admin/features/users/types';

/** Permissions grouped by area; each group has an all/none toggle. Read-only when `disabled`. */
export function PermissionChecklist({
    catalog,
    value,
    onChange,
    disabled,
}: {
    catalog: PermissionInfo[];
    value: Permission[];
    onChange?: (next: Permission[]) => void;
    disabled?: boolean;
}) {
    const groups = catalog.reduce<{ name: string; items: PermissionInfo[] }[]>(
        (acc, p) => {
            const g = acc.find((x) => x.name === p.group);
            if (g) g.items.push(p);
            else acc.push({ name: p.group, items: [p] });
            return acc;
        },
        [],
    );
    const has = new Set(value);
    const toggle = (k: Permission) =>
        onChange?.(has.has(k) ? value.filter((v) => v !== k) : [...value, k]);

    return (
        <div className="flex flex-col gap-4">
            {groups.map((g) => {
                const on = g.items.filter((i) => has.has(i.key)).length;
                const all = on === g.items.length;
                return (
                    <fieldset key={g.name} className="min-w-0">
                        <div className="mb-1.5 flex items-baseline justify-between">
                            <legend className="text-xs font-medium text-ink-muted">
                                {g.name}{' '}
                                <span className="tabular-nums">
                                    · {on} of {g.items.length}
                                </span>
                            </legend>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const keys = g.items.map((i) => i.key);
                                        onChange?.(
                                            all
                                                ? value.filter(
                                                      (v) => !keys.includes(v),
                                                  )
                                                : Array.from(
                                                      new Set([
                                                          ...value,
                                                          ...keys,
                                                      ]),
                                                  ),
                                        );
                                    }}
                                    className="cursor-pointer rounded text-xs font-medium text-brand-600 hover:text-brand-700"
                                >
                                    {all ? 'Clear all' : 'Select all'}
                                </button>
                            )}
                        </div>
                        <ul className="-mx-2 divide-y divide-line/70">
                            {g.items.map((p) => {
                                const checked = has.has(p.key);
                                return (
                                    <li key={p.key}>
                                        <label
                                            className={cn(
                                                'relative flex items-start gap-3 rounded-md px-2 py-2.5',
                                                disabled
                                                    ? 'cursor-default'
                                                    : 'cursor-pointer hover:bg-canvas/50',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={checked}
                                                disabled={disabled}
                                                onChange={() => toggle(p.key)}
                                            />
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1',
                                                    checked
                                                        ? 'border-brand-500 bg-brand-500 text-white'
                                                        : 'border-ink-subtle bg-canvas-card',
                                                    disabled &&
                                                        checked &&
                                                        'border-brand-300 bg-brand-300',
                                                )}
                                            >
                                                {checked && (
                                                    <Check
                                                        className="size-3"
                                                        strokeWidth={3}
                                                    />
                                                )}
                                            </span>
                                            <span className="min-w-0 leading-tight">
                                                <span className="block text-[13px] font-medium text-ink">
                                                    {p.label}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-ink-muted">
                                                    {p.description}
                                                </span>
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </fieldset>
                );
            })}
        </div>
    );
}
