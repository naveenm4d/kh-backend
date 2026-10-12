import { useState } from 'react';
import {
    CompactButton,
    CompactInput,
    Segmented,
} from '@admin/shared/components/controls';
import { useToast } from '@admin/shared/components/Toast';
import {
    formatCurrency,
    parseCurrencyInput,
} from '@admin/shared/utils/currency';
import { useRecordPayment } from '@admin/features/customers/hooks';
import type { CustomerPaymentInput } from '@admin/features/customers/types';
import {
    PAYMENT_METHODS,
    paymentError,
} from '@admin/features/customers/payment';

/** Inline form: money received against the balance. Defaults to settling the full amount owed. */
export function RecordPaymentForm({
    customerId,
    owed,
    onDone,
}: {
    customerId: string;
    owed: number;
    onDone: () => void;
}) {
    const [amount, setAmount] = useState(String(Math.round(owed)));
    const [method, setMethod] =
        useState<CustomerPaymentInput['method']>('CASH');
    const [note, setNote] = useState('');
    const record = useRecordPayment();
    const toast = useToast();

    const value = parseCurrencyInput(amount);
    const error = paymentError(value, owed);
    const remaining = Math.max(0, owed - value);

    const submit = async () => {
        if (error) return;
        try {
            await record.mutateAsync({
                id: customerId,
                input: { amount: value, method, note },
            });
            toast.success(`Payment of ${formatCurrency(value)} recorded`);
            onDone();
        } catch (err) {
            toast.error(
                (err as { message?: string })?.message ??
                    'Could not record the payment',
            );
        }
    };

    return (
        <form
            className="flex flex-col gap-3 rounded-lg border border-line bg-canvas/50 p-3.5"
            onSubmit={(e) => {
                e.preventDefault();
                void submit();
            }}
        >
            <div className="flex items-end gap-2">
                <label className="flex flex-1 flex-col gap-1">
                    <span className="text-xs font-medium text-ink-muted">
                        Amount received
                    </span>
                    <CompactInput
                        autoFocus
                        inputMode="numeric"
                        value={amount}
                        invalid={!!error}
                        onChange={(e) => setAmount(e.target.value)}
                        aria-describedby="payment-hint"
                    />
                </label>
                <CompactButton
                    variant="ghost"
                    onClick={() => setAmount(String(Math.round(owed)))}
                >
                    Full amount
                </CompactButton>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink-muted">
                    Paid by
                </span>
                <Segmented
                    label="Paid by"
                    value={method}
                    onChange={setMethod}
                    options={PAYMENT_METHODS}
                />
            </div>
            <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink-muted">
                    Note (optional)
                </span>
                <CompactInput
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. paid at the counter"
                />
            </label>
            <div
                id="payment-hint"
                className={
                    error
                        ? 'text-xs text-danger-text'
                        : 'text-xs text-ink-muted tabular-nums'
                }
            >
                {error ??
                    (remaining > 0
                        ? `Leaves ${formatCurrency(remaining)} owing`
                        : 'Settles the balance in full')}
            </div>
            <div className="flex gap-2">
                <CompactButton
                    type="submit"
                    variant="primary"
                    busy={record.isPending}
                    disabled={!!error}
                >
                    Record payment
                </CompactButton>
                <CompactButton onClick={onDone}>Cancel</CompactButton>
            </div>
        </form>
    );
}
