export type ReportGranularity = 'day' | 'month';

/** Inclusive YYYY-MM-DD range. */
export interface ReportQuery {
    from: string;
    to: string;
    granularity: ReportGranularity;
}

export interface ReportTotals {
    revenue: number;
    bills: number;
    avgBill: number;
    creditSales: number;
    cancelledBills: number;
}

/** `key` is YYYY-MM-DD (day buckets) or YYYY-MM (month buckets). */
export interface ReportSeriesPoint {
    key: string;
    revenue: number;
    bills: number;
}

export interface ReportBreakdownItem {
    key: string;
    revenue: number;
    bills: number;
}

export interface ReportSummary {
    from: string;
    to: string;
    granularity: ReportGranularity;
    totals: ReportTotals;
    series: ReportSeriesPoint[];
    byPayment: ReportBreakdownItem[];
    byCategory: ReportBreakdownItem[];
    byCashier: ReportBreakdownItem[];
}
