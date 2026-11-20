import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@admin/shared/lib/http';

/** A registered cashier till. */
export interface Terminal {
    id: string;
    name: string;
    /** First characters of the key, to tell keys apart. */
    keyHint: string;
    lastSeenAt: string | null;
    lastIp: string | null;
    revokedAt: string | null;
    createdAt: string | null;
    /** Staff currently signed in on it. */
    signedIn: number;
}

const key = ['terminals'] as const;

export function useTerminals() {
    return useQuery({
        queryKey: key,
        queryFn: () => http.get<Terminal[]>('/terminals'),
    });
}

/** Creates a terminal key; the response carries the key, shown once. */
export function useRegisterTerminal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (name: string) =>
            http.post<Terminal & { key: string }>('/terminals', { name }),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
}

export function useDeleteTerminal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.delete<void>(`/terminals/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
}
