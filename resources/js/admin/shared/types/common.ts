export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface QueryParams {
    search?: string;
    page?: number;
    pageSize?: number;
    [key: string]: string | number | undefined;
}
