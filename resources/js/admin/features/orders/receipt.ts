import type { ReceiptData } from '@admin/shared/components/ThermalReceipt';
import { formatCurrency } from '@admin/shared/utils/currency';
import { lineQty } from '@admin/shared/utils/units';
import { formatPct } from '@admin/features/products/pricing';
import { paymentLabel } from '@admin/features/orders/constants';
import type {
    Order,
    OrderLineItem,
    OrderStatus,
    PaymentMethod,
} from '@admin/features/orders/types';

/** Kept for existing call sites; the single source is `paymentLabel` in constants. */
export const PAYMENT_LABEL: Record<PaymentMethod, string> = paymentLabel;

export const STATUS_LABEL: Record<OrderStatus, string> = {
    READY_TO_COLLECT: 'Ready for collection',
    PAYMENT_PENDING: 'Payment pending',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

/** Line discount % isn't persisted on OrderLineItem (only the final total is), so it's derived from unitPrice*qty vs. total. */
export function itemDiscountPct(item: OrderLineItem): number {
    const raw = item.unitPrice * item.qty;
    return raw > 0 ? formatPct((1 - item.total / raw) * 100) : 0;
}

/** Pre-discount subtotal and total discount, derived from line items (neither is persisted on Order). */
export function orderTotals(order: Order): {
    subtotal: number;
    discount: number;
} {
    const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    return { subtotal, discount: subtotal - order.amount };
}

/**
 * "2026-11-21 21:00:00": when the bill was rung up, printed in one Date row. Bills without a
 * timestamp fall back to their date alone.
 */
export function billDateTime(
    createdAt: string | null | undefined,
    fallbackDate = '',
): string {
    const d = createdAt ? new Date(createdAt) : null;
    if (!d || Number.isNaN(d.getTime())) return fallbackDate;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Reprints only have the persisted Order — subtotal/discount and cash tendered weren't stored, so they're derived from the final line totals, and Paid/Change assume full settlement. */
export function buildReceiptData(order: Order): ReceiptData {
    const items = order.items.map((item) => {
        const rawSubtotal = item.qty * item.unitPrice;
        const discountAmt = rawSubtotal - item.total;
        return {
            name: item.name,
            qtyLabel: `${lineQty(item.qty, item.unit, item.measured)} × ${formatCurrency(item.unitPrice)}`,
            subtotalFmt: formatCurrency(rawSubtotal),
            hasDiscount: discountAmt > 0,
            discountPct:
                rawSubtotal > 0
                    ? formatPct((discountAmt / rawSubtotal) * 100)
                    : 0,
            discountAmtFmt: formatCurrency(discountAmt),
            qty: item.qty,
            unit: item.unit,
            measured: item.measured,
            source: item.source,
        };
    });
    const { subtotal, discount } = orderTotals(order);

    return {
        invoice: order.invoice,
        dateLabel: billDateTime(order.createdAt, order.date),
        timeLabel: '',
        // Receipts show the cashier's code, not their name (older bills without one fall back to the name).
        cashier: order.cashierCode || order.cashier,
        payment: order.payment,
        customer: order.customerId ? { name: order.customer } : undefined,
        items,
        subtotalFmt: formatCurrency(subtotal),
        hasDiscount: discount > 0,
        discountFmt: formatCurrency(discount),
        grandTotalFmt: formatCurrency(order.amount),
        paidFmt: formatCurrency(order.amount),
        changeFmt: formatCurrency(0),
    };
}
