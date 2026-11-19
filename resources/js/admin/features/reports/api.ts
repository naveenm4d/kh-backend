import { http } from '@admin/shared/lib/http';
import type { ReportQuery, ReportSummary } from '@admin/features/reports/types';

export const reportsApi = {
    getSummary: (query: ReportQuery): Promise<ReportSummary> =>
        http.get('/reports/summary', { ...query }),
};
