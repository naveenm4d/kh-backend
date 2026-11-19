import { useCallback } from 'react';
import { useSearchParams } from '@admin/shared/lib/router';

/**
 * The selected record lives in the URL (?id=…), so the dashboard and reports can deep-link straight
 * to a customer, order or product, and back/forward steps through selections.
 */
export function useSelectedId(param = 'id') {
    const [params, setParams] = useSearchParams();
    const selected = params.get(param);
    const select = useCallback(
        (id: string | null) => {
            setParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    if (id) next.set(param, id);
                    else next.delete(param);
                    return next;
                },
                { replace: true },
            );
        },
        [param, setParams],
    );
    return [selected, select] as const;
}
