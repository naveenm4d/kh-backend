/** Mirrors App\Http\Resources\ActivityResource. */
export interface ActivityChange {
    field: string;
    label: string;
    from: unknown;
    to: unknown;
}

export type ActivityGroup =
    | 'bills'
    | 'customers'
    | 'stock'
    | 'catalog'
    | 'staff'
    | 'settings'
    | 'signin';

export interface ActivityEntry {
    id: string;
    at: string;
    action: string;
    actionLabel: string;
    group: ActivityGroup;
    summary: string;
    actorId: string | null;
    /** Empty for failed sign-ins: nobody was signed in. */
    actorName: string;
    /** The till it happened on; null in the admin console. */
    terminalName: string | null;
    ip: string;
    subjectType: string | null;
    subjectId: string | null;
    subjectLabel: string;
    changes: ActivityChange[];
}

export interface ActivityQuery {
    search?: string;
    userId?: string;
    group?: ActivityGroup;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
    [key: string]: string | number | undefined;
}

export interface ActivityFilters {
    actors: { id: string; name: string }[];
    groups: { key: ActivityGroup; label: string }[];
}
