import { ArrowLeftRight } from 'lucide-react';
import { cn } from '@admin/shared/lib/cn';
import { Card } from '@admin/shared/components/Card';
import {
    DateField,
    MiniSelect,
    Swatch,
} from '@admin/shared/components/controls';
import {
    PRESET_OPTIONS,
    compareOptions,
    formatRange,
    isValidRange,
} from '@admin/features/reports/periods';
import type {
    CompareMode,
    DateRange,
    PeriodPreset,
} from '@admin/features/reports/periods';

export interface PeriodState {
    preset: PeriodPreset;
    day: string;
    custom: DateRange;
    compare: CompareMode;
    compareCustom: DateRange;
}

function RangeFields({
    value,
    onChange,
    label,
}: {
    value: DateRange;
    onChange: (r: DateRange) => void;
    label: string;
}) {
    const invalid = !isValidRange(value);
    return (
        <div className="flex items-center gap-1.5">
            <DateField
                aria-label={`${label} start`}
                value={value.from}
                max={value.to}
                invalid={invalid}
                onChange={(e) => onChange({ ...value, from: e.target.value })}
            />
            <span className="text-xs text-ink-muted">to</span>
            <DateField
                aria-label={`${label} end`}
                value={value.to}
                min={value.from}
                invalid={invalid}
                onChange={(e) => onChange({ ...value, to: e.target.value })}
            />
        </div>
    );
}

function Side({
    which,
    title,
    range,
    children,
}: {
    which: 'a' | 'b';
    title: string;
    range: DateRange | null;
    children: React.ReactNode;
}) {
    const valid = !!range && isValidRange(range);
    return (
        <div className="flex min-w-0 flex-1 flex-col gap-2 px-5 py-3.5">
            <div className="flex items-center gap-2 text-[13px]">
                <Swatch which={which} />
                <span className="font-medium text-ink">{title}</span>
                <span
                    className={cn(
                        'truncate',
                        valid
                            ? 'text-ink-muted tabular-nums'
                            : range
                              ? 'text-danger-text'
                              : 'text-ink-muted',
                    )}
                >
                    {valid
                        ? formatRange(range)
                        : range
                          ? 'Start date must be on or before the end date'
                          : 'Waiting for a valid period'}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    );
}

export function PeriodBar({
    state,
    onChange,
    a,
    b,
}: {
    state: PeriodState;
    onChange: (patch: Partial<PeriodState>) => void;
    a: DateRange;
    /** null while A is invalid: B is derived from A, so there's nothing honest to show yet. */
    b: DateRange | null;
}) {
    const canSwap = isValidRange(a) && !!b && isValidRange(b);
    const swap = () => {
        if (!canSwap || !b) return;
        onChange({
            preset: 'custom',
            custom: b,
            compare: 'custom',
            compareCustom: a,
        });
    };
    return (
        <Card className="flex flex-col lg:flex-row lg:items-stretch">
            <Side which="a" title="Period" range={a}>
                <MiniSelect
                    aria-label="Period"
                    value={state.preset}
                    onChange={(preset) => onChange({ preset })}
                    options={PRESET_OPTIONS}
                    className="w-44"
                />
                {state.preset === 'day' && (
                    <DateField
                        aria-label="Day"
                        value={state.day}
                        onChange={(e) =>
                            e.target.value && onChange({ day: e.target.value })
                        }
                    />
                )}
                {state.preset === 'custom' && (
                    <RangeFields
                        label="Period"
                        value={state.custom}
                        onChange={(custom) => onChange({ custom })}
                    />
                )}
            </Side>

            <div className="flex items-center justify-center gap-1.5 px-5 lg:flex-col lg:px-0">
                <span
                    className="h-px flex-1 bg-line lg:h-auto lg:w-px"
                    aria-hidden
                />
                <button
                    type="button"
                    onClick={swap}
                    disabled={!canSwap}
                    title="Swap the two periods"
                    aria-label="Swap the two periods"
                    className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-canvas-card text-ink-muted shadow-soft transition-colors hover:border-ink-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ArrowLeftRight className="size-3.5" />
                </button>
                <span
                    className="h-px flex-1 bg-line lg:h-auto lg:w-px"
                    aria-hidden
                />
            </div>

            <Side which="b" title="Compared with" range={b}>
                <MiniSelect
                    aria-label="Compare with"
                    value={state.compare}
                    onChange={(compare) => onChange({ compare })}
                    options={compareOptions(state.preset)}
                    className="w-52"
                />
                {state.compare === 'custom' && (
                    <RangeFields
                        label="Comparison"
                        value={state.compareCustom}
                        onChange={(compareCustom) =>
                            onChange({ compareCustom })
                        }
                    />
                )}
            </Side>
        </Card>
    );
}
