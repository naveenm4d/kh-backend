import {
    Banknote,
    Building2,
    CreditCard,
    FileText,
    Receipt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@admin/shared/components/Badge';
import type { OrderStatus, PaymentMethod } from '@admin/features/orders/types';

export const statusTone: Record<OrderStatus, BadgeTone> = {
    PENDING: 'warning',
    ISSUED: 'brand',
    COMPLETED: 'success',
    CANCELLED: 'danger',
};

export const paymentLabel: Record<PaymentMethod, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    'BANK TRANSFER': 'Bank transfer',
    CHEQUE: 'Cheque',
    CREDIT: 'Credit',
};

/** One icon per payment method, shared by the payment screen and the record-payment form so they always match. */
export const paymentIcon: Record<PaymentMethod, LucideIcon> = {
    CASH: Banknote,
    CARD: CreditCard,
    'BANK TRANSFER': Building2,
    CHEQUE: FileText,
    CREDIT: Receipt,
};
