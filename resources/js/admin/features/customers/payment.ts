import { formatCurrency } from '@admin/shared/utils/currency';
import type {
    CustomerDetail,
    CustomerPaymentInput,
} from '@admin/features/customers/types';

/** Ways a customer can pay off credit (credit itself isn't one). */
export const PAYMENT_METHODS: {
    value: CustomerPaymentInput['method'];
    label: string;
}[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK TRANSFER', label: 'Bank transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
];

/** Why a payment amount can't be recorded, or null if it can: more than zero, and no more than what's owed. */
export function paymentError(amount: number, owed: number): string | null {
    if (amount <= 0) return 'Enter an amount greater than zero';
    if (amount > Math.round(owed))
        return `That's more than the ${formatCurrency(owed)} owed`;
    return null;
}

export type HistoryEntry =
    | {
          kind: 'bill';
          date: string;
          key: string;
          bill: CustomerDetail['bills'][number];
      }
    | {
          kind: 'payment';
          date: string;
          key: string;
          payment: CustomerDetail['payments'][number];
      };

/** Bills and payments in one list, newest first; on the same day a payment sorts above the bills. */
export function customerHistory(c: CustomerDetail): HistoryEntry[] {
    const entries: HistoryEntry[] = [
        ...c.bills.map((bill) => ({
            kind: 'bill' as const,
            date: bill.date,
            key: bill.invoice,
            bill,
        })),
        ...c.payments.map((payment) => ({
            kind: 'payment' as const,
            date: payment.date,
            key: payment.id,
            payment,
        })),
    ];
    return entries.sort((a, b) =>
        a.date === b.date
            ? a.kind === 'payment'
                ? -1
                : 1
            : a.date < b.date
              ? 1
              : -1,
    );
}
