import type { CurrencyCode, Money } from "./types.ts";
import {
  add as dineroAdd,
  dinero,
  toDecimal,
  toSnapshot,
} from "dinero.js/bigint";


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

/** Zero in the given currency. */
export function zero(currency: CurrencyCode): Money {
  return money(0n, currency);
}

export function format(amount: Money): string {
  const value = dinero({
    amount: amount.minorUnits,
    currency: CURRENCIES[amount.currency],
  });

  return `${amount.currency} ${toDecimal(value)}`;
}

/** Thrown when an operation combines amounts of different currencies. */
export class CurrencyMismatchError extends Error {
  override name = "CurrencyMismatchError";
}

/** Same-currency addition; throws CurrencyMismatchError otherwise. */
export function add(augend: Money, addend: Money): Money {
  if (augend.currency !== addend.currency) {
    throw new CurrencyMismatchError(
        `Cannot add ${augend.currency} and ${addend.currency}`,
    );
  }

  const result = dineroAdd(
      dinero({
        amount: augend.minorUnits,
        currency: CURRENCIES[augend.currency],
      }),
      dinero({
        amount: addend.minorUnits,
        currency: CURRENCIES[addend.currency],
      }),
  );

  return money(toSnapshot(result).amount, augend.currency);
}

export type { CurrencyCode, Money } from "./types.ts";
