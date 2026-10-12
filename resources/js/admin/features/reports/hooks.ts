import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportsApi } from '@admin/features/reports/api';
import type { ReportQuery } from '@admin/features/reports/types';

/** Range summary. Keeps the previous result on screen while a new period loads, so the page doesn't blank out. */
export function useReportSummary(query: ReportQuery | null) {
    return useQuery({
        queryKey: ['reports', 'summary', query],
        queryFn: () => reportsApi.getSummary(query as ReportQuery),
        enabled: !!query,
        placeholderData: keepPreviousData,
    });
}
