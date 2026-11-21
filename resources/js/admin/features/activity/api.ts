import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { http } from '@admin/shared/lib/http';
import type { Paginated } from '@admin/shared/types/common';
import type {
    ActivityEntry,
    ActivityFilters,
    ActivityQuery,
} from '@admin/features/activity/types';

const key = ['activity'] as const;

export function useActivity(query: ActivityQuery) {
    return useQuery({
        queryKey: [...key, 'list', query],
        queryFn: () =>
            http.get<Paginated<ActivityEntry>>('/activity', { ...query }),
        placeholderData: keepPreviousData,
    });
}

export function useActivityFilters() {
    return useQuery({
        queryKey: [...key, 'filters'],
        queryFn: () => http.get<ActivityFilters>('/activity/filters'),
        staleTime: 60_000,
    });
}
