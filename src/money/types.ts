export type CurrencyCode = "AED" | "BHD";

export interface Money {
    readonly currency: CurrencyCode;
    readonly minorUnits: bigint;
}

export type Comparison = -1 | 0 | 1;