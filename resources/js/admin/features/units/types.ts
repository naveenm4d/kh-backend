/** What products are sold by. Counted units take whole numbers; measured ones (length, weight) up to `decimals`. */
export interface Unit {
    id: string;
    name: string;
    /** Sold by length or weight: quantities show with the unit ("2.5 kg"). */
    measured: boolean;
    /** Decimal places a quantity may have (0–3); always 0 for counted units. */
    decimals: number;
    /** Products sold by it, including deleted ones; a unit in use can't be deleted. */
    productCount: number;
}

export interface UnitInput {
    name: string;
    measured: boolean;
    decimals: number;
}
