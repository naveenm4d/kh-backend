import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@admin/shared/components/Badge';
import { Card } from '@admin/shared/components/Card';
import { CompactButton, CompactInput } from '@admin/shared/components/controls';
import { ThermalReceipt } from '@admin/shared/components/ThermalReceipt';
import type { ReceiptData } from '@admin/shared/components/ThermalReceipt';
import { useToast } from '@admin/shared/components/Toast';
import { cn } from '@admin/shared/lib/cn';
import {
    DEFAULT_SHOP,
    useShopSettings,
    useUpdateShopSettings,
} from '@admin/features/settings/shop';
import type { ShopSettings } from '@admin/features/settings/shop';

/** Sample sale for the live preview (clearly a sample, never a real invoice). */
const SAMPLE: ReceiptData = {
    invoice: 'SAMPLE-0001',
    dateLabel: 'Sample receipt',
    timeLabel: '',
    cashier: 'Cashier',
    payment: 'Cash',
    items: [
        {
            name: 'Tokyo Cement 50kg',
            qtyLabel: '2 × Rs. 2,750',
            subtotalFmt: 'Rs. 5,500',
            hasDiscount: false,
        },
        {
            name: 'Philips LED Bulb 9W',
            qtyLabel: '3 × Rs. 790',
            subtotalFmt: 'Rs. 2,370',
            hasDiscount: false,
        },
    ],
    subtotalFmt: 'Rs. 7,870',
    hasDiscount: false,
    discountFmt: 'Rs. 0',
    grandTotalFmt: 'Rs. 7,870',
    paidFmt: 'Rs. 8,000',
    changeFmt: 'Rs. 130',
};

export function Section({
    title,
    scope,
    description,
    actions,
    children,
}: {
    title: string;
    scope: 'This till' | 'All tills';
    description: string;
    actions?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-4 pb-3.5">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-ink">
                            {title}
                        </h2>
                        <Badge
                            tone={scope === 'This till' ? 'neutral' : 'brand'}
                            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-ink/5 ring-inset"
                            title={
                                scope === 'This till'
                                    ? 'Saved on this computer only'
                                    : 'Shared by every till in the shop'
                            }
                        >
                            {scope}
                        </Badge>
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                        {description}
                    </p>
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
            <div className="divide-y divide-line/70">{children}</div>
        </Card>
    );
}

/** Label + hint on the left, control on the right: the settings row. */
export function Row({
    label,
    hint,
    children,
    align = 'center',
}: {
    label: string;
    hint?: ReactNode;
    children: ReactNode;
    align?: 'center' | 'start';
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 px-5 py-3.5',
                align === 'center' ? 'items-center' : 'items-start',
            )}
        >
            <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink">{label}</div>
                {hint && (
                    <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>
                )}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

export function SettingsPage() {
    const saved = useShopSettings();
    const update = useUpdateShopSettings();
    const toast = useToast();
    const [draft, setDraft] = useState<ShopSettings>(saved);
    const [low, setLow] = useState(String(saved.lowStock));
    const [critical, setCritical] = useState(String(saved.criticalStock));

    // Pick up the loaded values (first load lands after the defaults).
    useEffect(() => {
        setDraft(saved);
        setLow(String(saved.lowStock));
        setCritical(String(saved.criticalStock));
    }, [saved]);

    const set = (patch: Partial<ShopSettings>) =>
        setDraft((d) => ({ ...d, ...patch }));
    const lowN = Number(low);
    const critN = Number(critical);
    const errors = {
        storeName: !draft.storeName.trim()
            ? 'The shop name heads every receipt'
            : null,
        low:
            !/^\d+$/.test(low) || lowN < 1 ? 'A whole number, 1 or more' : null,
        critical: !/^\d+$/.test(critical)
            ? 'A whole number, 0 or more'
            : critN >= lowN
              ? 'Must be below the low-stock level'
              : null,
    };
    const invalid = Object.values(errors).some(Boolean);
    const LABELS = {
        storeName: 'Shop name',
        low: 'Low stock',
        critical: 'Very low',
    } as const;
    const firstKey = (Object.keys(errors) as (keyof typeof errors)[]).find(
        (k) => errors[k],
    );
    const firstError = firstKey
        ? {
              id: `setting-${firstKey}`,
              message: `${LABELS[firstKey]}: ${errors[firstKey]}`,
          }
        : null;
    const focusField = (id: string) => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el?.focus({ preventScroll: true });
    };
    const next: ShopSettings = {
        ...draft,
        lowStock: lowN,
        criticalStock: critN,
    };
    const dirty = useMemo(
        () => JSON.stringify(next) !== JSON.stringify(saved),
        [next, saved],
    );

    const save = async () => {
        if (invalid) return;
        try {
            await update.mutateAsync(next);
            toast.success('Saved for every till');
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not save the settings',
            );
        }
    };
    const discard = () => {
        setDraft(saved);
        setLow(String(saved.lowStock));
        setCritical(String(saved.criticalStock));
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="px-8 pt-7 pb-5">
                <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">
                    Settings
                </h1>
                <p className="mt-1 text-[13px] text-ink-muted">
                    Shared by every till in the shop. Printers and receipt
                    copies are set on each till itself.
                </p>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
                <div className="flex max-w-[1180px] items-start gap-6">
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <form
                            className="flex flex-col gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void save();
                            }}
                        >
                            <Section
                                title="Shop details"
                                scope="All tills"
                                description="Printed at the top and bottom of every receipt."
                            >
                                <Row
                                    label="Shop name"
                                    hint={
                                        errors.storeName && (
                                            <span className="text-danger-text">
                                                {errors.storeName}
                                            </span>
                                        )
                                    }
                                >
                                    <CompactInput
                                        id="setting-storeName"
                                        className="w-full"
                                        value={draft.storeName}
                                        invalid={!!errors.storeName}
                                        onChange={(e) =>
                                            set({ storeName: e.target.value })
                                        }
                                    />
                                </Row>
                                <Row label="Address">
                                    <CompactInput
                                        className="w-full"
                                        value={draft.address}
                                        onChange={(e) =>
                                            set({ address: e.target.value })
                                        }
                                    />
                                </Row>
                                <Row label="Phone">
                                    <CompactInput
                                        className="w-full"
                                        inputMode="tel"
                                        value={draft.phone}
                                        onChange={(e) =>
                                            set({ phone: e.target.value })
                                        }
                                    />
                                </Row>
                                <Row
                                    label="Registration no."
                                    hint="Leave empty to leave it off receipts."
                                >
                                    <CompactInput
                                        className="w-full"
                                        value={draft.regNo}
                                        onChange={(e) =>
                                            set({ regNo: e.target.value })
                                        }
                                    />
                                </Row>
                                <Row
                                    label="Receipt footer"
                                    hint="One line per receipt line. The first line prints in bold."
                                    align="start"
                                >
                                    <textarea
                                        rows={4}
                                        value={draft.receiptFooter}
                                        onChange={(e) =>
                                            set({
                                                receiptFooter: e.target.value,
                                            })
                                        }
                                        className="w-full resize-y rounded-lg border border-line bg-canvas-card px-2.5 py-2 text-[13px] leading-5 text-ink shadow-soft transition-colors hover:border-ink-subtle"
                                    />
                                </Row>
                            </Section>

                            <Section
                                title="Stock alerts"
                                scope="All tills"
                                description="When an item counts as running low, on the dashboard, Inventory and the cashier screen."
                            >
                                <Row
                                    label="Low stock at"
                                    hint={
                                        errors.low ? (
                                            <span className="text-danger-text">
                                                {errors.low}
                                            </span>
                                        ) : (
                                            'Amber: time to reorder.'
                                        )
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        <CompactInput
                                            id="setting-low"
                                            inputMode="numeric"
                                            className="w-24"
                                            value={low}
                                            invalid={!!errors.low}
                                            onChange={(e) =>
                                                setLow(e.target.value.trim())
                                            }
                                        />
                                        <span className="text-[13px] text-ink-muted">
                                            units or fewer
                                        </span>
                                    </div>
                                </Row>
                                <Row
                                    label="Very low at"
                                    hint={
                                        errors.critical ? (
                                            <span className="text-danger-text">
                                                {errors.critical}
                                            </span>
                                        ) : (
                                            'Red: about to run out.'
                                        )
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        <CompactInput
                                            id="setting-critical"
                                            inputMode="numeric"
                                            className="w-24"
                                            value={critical}
                                            invalid={!!errors.critical}
                                            onChange={(e) =>
                                                setCritical(
                                                    e.target.value.trim(),
                                                )
                                            }
                                        />
                                        <span className="text-[13px] text-ink-muted">
                                            units or fewer
                                        </span>
                                    </div>
                                </Row>
                                {!errors.low && !errors.critical && (
                                    <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-xs text-ink-muted tabular-nums">
                                        Example:
                                        <Badge
                                            tone="danger"
                                            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                                        >
                                            {critN === 0
                                                ? 'Out of stock'
                                                : `${critN} left`}
                                        </Badge>
                                        <Badge
                                            tone="warning"
                                            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                                        >
                                            {lowN} left
                                        </Badge>
                                        <span className="text-ink">
                                            {lowN + 1}
                                        </span>{' '}
                                        is fine
                                    </div>
                                )}
                            </Section>

                            {dirty && (
                                <div className="sticky bottom-0 pb-1">
                                    <div className="flex items-center gap-2 rounded-card border border-line bg-canvas-card px-4 py-3 shadow-pop">
                                        {firstError ? (
                                            <span className="mr-auto flex min-w-0 items-center gap-1.5 text-[13px] text-danger-text">
                                                <AlertCircle className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {firstError.message}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        focusField(
                                                            firstError.id,
                                                        )
                                                    }
                                                    className="shrink-0 cursor-pointer font-medium underline underline-offset-2"
                                                >
                                                    Fix it
                                                </button>
                                            </span>
                                        ) : (
                                            <span className="mr-auto text-[13px] text-ink-muted">
                                                Unsaved changes to shared
                                                settings
                                            </span>
                                        )}
                                        <CompactButton onClick={discard}>
                                            Discard
                                        </CompactButton>
                                        <CompactButton
                                            type="submit"
                                            variant="primary"
                                            disabled={invalid}
                                            busy={update.isPending}
                                        >
                                            Save for all tills
                                        </CompactButton>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <aside className="sticky top-0 hidden w-[340px] shrink-0 xl:block">
                        <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-muted">
                            <span>Receipt preview</span>
                            {dirty && (
                                <span className="text-brand-600">
                                    Showing unsaved changes
                                </span>
                            )}
                        </div>
                        <div className="rounded-card border border-line bg-canvas px-3 py-5">
                            <ThermalReceipt
                                data={SAMPLE}
                                shop={{ ...DEFAULT_SHOP, ...draft }}
                            />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
