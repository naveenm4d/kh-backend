import type { OrderStatus, PaymentMethod } from '@admin/features/orders/types';

export interface DailyTrendPoint {
    date: string;
    label: string;
    total: number;
}

export interface CategoryBreakdownItem {
    group: string;
    value: number;
}

export interface TopProduct {
    name: string;
    units: number;
    price: number;
    revenue: number;
}

export interface LowStockItem {
    id: string;
    name: string;
    group: string;
    unit: string;
    measured: boolean;
    stock: number;
}

export interface DebtorItem {
    id: string;
    name: string;
    phone: string;
    credit: number;
}

export interface RecentOrder {
    invoice: string;
    date: string;
    customer: string;
    payment: PaymentMethod;
    status: OrderStatus;
    amount: number;
}

export interface DashboardSummary {
    todaySales: number;
    todayOrders: number;
    monthSales: number;
    monthOrders: number;
    outstandingCredit: number;
    customersWithBalance: number;
    lowStockCount: number;
    totalOrders30d: number;
    dailyTrend: DailyTrendPoint[];
    categoryBreakdown: CategoryBreakdownItem[];
    topProducts: TopProduct[];
    yesterdaySales: number;
    yesterdayOrders: number;
    /** Last month's sales from day 1 up to today's day-of-month. */
    prevMonthSalesToDate: number;
    /** Lowest-stock items at or below the low-stock threshold, fewest first (max 6). */
    lowStockItems: LowStockItem[];
    /** Customers with the largest outstanding credit (max 5). */
    topDebtors: DebtorItem[];
    /** Latest bills of any status, newest first (max 7). */
    recentOrders: RecentOrder[];
}
