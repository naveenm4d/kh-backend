export interface Category {
    id: string;
    name: string;
    parent: string;
    group: string;
}

export interface CategoryInput {
    name: string;
    parent: string;
    group: string;
}
