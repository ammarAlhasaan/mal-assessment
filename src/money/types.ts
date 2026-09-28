export type CurrencyCode = "AED" | "BHD";

export interface Money {
    readonly currency: CurrencyCode;
    readonly minorUnits: bigint;
}