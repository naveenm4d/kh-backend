import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@admin/features/dashboard/api';

export function useDashboardSummary() {
    return useQuery({
        queryKey: ['dashboard', 'summary'],
        queryFn: dashboardApi.getSummary,
    });
}
