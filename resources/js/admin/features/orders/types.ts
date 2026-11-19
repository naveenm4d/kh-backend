export type PaymentMethod =
    | 'CASH'
    | 'CARD'
    | 'BANK TRANSFER'
    | 'CHEQUE'
    | 'CREDIT';
export type OrderStatus = 'PENDING' | 'ISSUED' | 'COMPLETED' | 'CANCELLED';

export type ItemSource = 'STORE' | 'WAREHOUSE';

export interface OrderLineItem {
    productId: string;
    name: string;
    /** In `unit`: whole for counted units, decimals for m, ft, kg. */
    qty: number;
    /** The unit it was sold in, kept on the bill. */
    unit: string;
    /** That unit was measured (length or weight): shown as "2.5 kg". */
    measured: boolean;
    unitPrice: number;
    total: number;
    source?: ItemSource;
}

export interface Order {
    invoice: string;
    date: string;
    customerId: string | null;
    customer: string;
    payment: PaymentMethod;
    status: OrderStatus;
    cashier: string;
    /** The cashier's code when the bill was rung up; printed on receipts. Empty on very old bills. */
    cashierCode: string;
    items: OrderLineItem[];
    amount: number;
}

export interface CreateOrderItemInput {
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
    discountPct: number;
    source?: ItemSource;
}

export interface CreateOrderInput {
    customerId: string | null;
    customer: string;
    cashier: string;
    items: CreateOrderItemInput[];
    payment: PaymentMethod;
    cashReceived?: number;
}

export interface OrderQuery {
    search?: string;
    customerId?: string;
    status?: OrderStatus;
    payment?: PaymentMethod;
    /** YYYY-MM-DD */
    date?: string;
    page?: number;
    pageSize?: number;
}
