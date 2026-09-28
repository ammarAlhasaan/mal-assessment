import type { CurrencyCode, Money } from "./types.ts";

/** Single source of truth for currency precision: AED 2 decimal places, BHD 3. */
const CURRENCIES: { readonly [C in CurrencyCode]: DineroCurrency<bigint, C> } = {
  AED: { code: "AED", base: 10n, exponent: 2n },
  BHD: { code: "BHD", base: 10n, exponent: 3n },
};

/** Number of decimal places for the currency. */
export function decimalPlaces(currency: CurrencyCode): number {
  return Number(CURRENCIES[currency].exponent);
}


/** Creates money from integer minor units. */
export function money(minorUnits: bigint, currency: CurrencyCode): Money {
  return {
    minorUnits,
    currency,
  };
}

export type { CurrencyCode, Money } from "./types.ts";
