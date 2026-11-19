import { QueryClient } from '@tanstack/react-query';

/**
 * Data is cached per query key and revalidated after every change that could affect it (see each
 * feature's hooks), and on window focus so a long-open tab catches up with the tills.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: true,
        },
        mutations: {
            retry: 0,
        },
    },
});
