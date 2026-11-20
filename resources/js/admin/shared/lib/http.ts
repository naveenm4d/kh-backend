/**
 * JSON client for the admin console's /admin/api routes. Same-origin and session-authenticated:
 * Laravel's XSRF-TOKEN cookie is echoed back as a header on writes (CSRF protection). Failed
 * requests reject with an Error whose message is the server's human-readable `message`, which
 * every `catch (err) { err.message }` call site shows as-is.
 */

const BASE = '/admin/api';

export class HttpError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly errors: Record<string, string[]> = {},
    ) {
        super(message);
    }
}

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

type Query = Record<string, string | number | boolean | null | undefined>;

function withQuery(path: string, query?: Query): string {
    if (!query) return path;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null || v === '' || v === false) continue;
        params.set(k, v === true ? '1' : String(v));
    }
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Query,
): Promise<T> {
    const res = await fetch(BASE + withQuery(path, query), {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(body !== undefined
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...(method !== 'GET' ? { 'X-XSRF-TOKEN': xsrfToken() } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401 || res.status === 419) {
            // Session ended or CSRF token rotated: a full reload lands on the sign-in page.
            window.location.reload();
        }
        const message =
            (data as { message?: string }).message ||
            `Request failed (${res.status})`;
        throw new HttpError(
            message,
            res.status,
            (data as { errors?: Record<string, string[]> }).errors,
        );
    }
    return data as T;
}

export const http = {
    get: <T>(path: string, query?: Query) =>
        request<T>('GET', path, undefined, query),
    post: <T>(path: string, body?: unknown) =>
        request<T>('POST', path, body ?? {}),
    put: <T>(path: string, body?: unknown) =>
        request<T>('PUT', path, body ?? {}),
    delete: <T = void>(path: string) => request<T>('DELETE', path),
};
