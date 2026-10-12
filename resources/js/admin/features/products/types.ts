export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    group: string;
    /** What it's sold, priced and stocked by (a unit from the catalogue: Bag, kg…). */
    unit: string;
    unitId: string;
    /** Sold by length or weight: quantities show with the unit ("2.5 kg"). */
    measured: boolean;
    /** Decimal places a quantity may have: 0 for counted units, e.g. 2 for m, 3 for kg. */
    qtyDecimals: number;
    price: number;
    /** Marked price; 0 = none. When above `price`, POS adds the item at this price with an automatic discount down to `price`. */
    displayPrice: number;
    stock: number;
    unitsSoldMonth: number;
    /** Quantity sold since this Monday (non-cancelled orders), computed by the backend. */
    unitsSoldWeek: number;
}

export interface ProductInput {
    name: string;
    brand: string;
    category: string;
    unit: string;
    price: number;
    displayPrice: number;
    stock: number;
}

export interface Brand {
    id: string;
    name: string;
}

export interface BrandInput {
    name: string;
}

export interface ProductQuery {
    search?: string;
    group?: string;
    /** 'popular' = units sold this week, then this month, then name. Default is name order. */
    sort?: 'popular';
    page?: number;
    pageSize?: number;
}
