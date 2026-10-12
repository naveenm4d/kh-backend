/**
 * The few react-router APIs the admin screens use, implemented on Inertia so the ported screens
 * keep their code. Search-param changes are client-side Inertia visits (no server round trip):
 * the selected record and filters live in the URL, so they deep-link and survive a reload.
 */
import { Link as InertiaLink, router, usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

export function Link({
    to,
    children,
    ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    to: string;
    children?: ReactNode;
}) {
    return (
        <InertiaLink href={to} {...(props as Record<string, unknown>)}>
            {children}
        </InertiaLink>
    );
}

export function useNavigate() {
    return useCallback((to: string | number, opts?: { replace?: boolean }) => {
        if (typeof to === 'number') {
            window.history.go(to);
            return;
        }
        router.visit(to, { replace: opts?.replace });
    }, []);
}

type ParamsInit =
    | URLSearchParams
    | Record<string, string>
    | ((prev: URLSearchParams) => URLSearchParams);

export function useSearchParams(): [
    URLSearchParams,
    (next: ParamsInit, opts?: { replace?: boolean }) => void,
] {
    const { url } = usePage();
    const params = useMemo(
        () => new URLSearchParams(url.split('?')[1] ?? ''),
        [url],
    );

    const setParams = useCallback(
        (next: ParamsInit, opts?: { replace?: boolean }) => {
            const current = new URLSearchParams(window.location.search);
            const resolved =
                typeof next === 'function'
                    ? next(current)
                    : next instanceof URLSearchParams
                      ? next
                      : new URLSearchParams(next);
            const qs = resolved.toString();
            const target = window.location.pathname + (qs ? `?${qs}` : '');
            const visit = {
                url: target,
                preserveScroll: true,
                preserveState: true,
            };
            if (opts?.replace === false) router.push(visit);
            else router.replace(visit);
        },
        [],
    );

    return [params, setParams];
}
