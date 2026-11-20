import { http } from '@admin/shared/lib/http';
import type { DashboardSummary } from '@admin/features/dashboard/types';

export const dashboardApi = {
    getSummary: (): Promise<DashboardSummary> => http.get('/dashboard'),
};
