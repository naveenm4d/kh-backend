import type { Order, PaymentMethod } from '@admin/features/orders/types';

export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    credit: number;
}

export interface CustomerInput {
    name: string;
    phone: string;
    address: string;
    credit: number;
}

export interface CustomerWithStats extends Customer {
    spent: number;
    orderCount: number;
    /** YYYY-MM-DD of the latest non-cancelled bill, or '' if none. */
    lastPurchase: string;
}

/** Money received against a customer's credit balance. */
export interface CustomerPayment {
    id: string;
    customerId: string;
    date: string;
    amount: number;
    method: PaymentMethod;
    note: string;
}

export interface CustomerPaymentInput {
    amount: number;
    method: Exclude<PaymentMethod, 'CREDIT'>;
    note: string;
}

export interface CustomerDetail extends CustomerWithStats {
    bills: Order[];
    payments: CustomerPayment[];
}

export interface CustomerQuery {
    search?: string;
    /** Only customers with a credit balance, largest first. */
    owing?: boolean;
    page?: number;
    pageSize?: number;
}
