import type {
    Comparison,
    CurrencyCode,
    Money,
} from "./types.ts";

import {
    add as dineroAdd,
    allocate as dineroAllocate,
    compare as dineroCompare,
    dinero,
    halfUp,
    multiply,
    subtract as dineroSubtract,
    toDecimal,
    toSnapshot,
    transformScale,
    type DineroCurrency,
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


/** Thrown when money is created in a currency the adapter does not define. */
export class UnsupportedCurrencyError extends Error {
  override name = "UnsupportedCurrencyError";
}

/** Creates frozen money from integer minor units. */
export function money(minorUnits: bigint, currency: CurrencyCode): Money {
  if (!Object.hasOwn(CURRENCIES, currency)) {
    throw new UnsupportedCurrencyError(`Unsupported currency: ${String(currency)}`);
  }

  if (typeof minorUnits !== "bigint") {
    throw new TypeError("Money minor units must be a bigint");
  }

  return Object.freeze({
    minorUnits,
    currency,
  });
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


/** Same-currency subtraction; throws CurrencyMismatchError otherwise. */
export function subtract(minuend: Money, subtrahend: Money): Money {
  if (minuend.currency !== subtrahend.currency) {
    throw new CurrencyMismatchError(
        `Cannot subtract ${subtrahend.currency} from ${minuend.currency}`,
    );
  }

  const result = dineroSubtract(
      dinero({
        amount: minuend.minorUnits,
        currency: CURRENCIES[minuend.currency],
      }),
      dinero({
        amount: subtrahend.minorUnits,
        currency: CURRENCIES[subtrahend.currency],
      }),
  );

  return money(toSnapshot(result).amount, minuend.currency);
}


/** Same-currency comparison; throws CurrencyMismatchError otherwise. */
export function compare(left: Money, right: Money): Comparison {
  if (left.currency !== right.currency) {
    throw new CurrencyMismatchError(
        `Cannot compare ${left.currency} and ${right.currency}`,
    );
  }

  return dineroCompare(
      dinero({
        amount: left.minorUnits,
        currency: CURRENCIES[left.currency],
      }),
      dinero({
        amount: right.minorUnits,
        currency: CURRENCIES[right.currency],
      }),
  );
}

/**
 * Splits total into parts that preserve the exact total and differ by at most
 * one minor unit. Remainder units go to the earliest parts first.
 */
export function allocateEqually(
    total: Money,
    parts: number,
): readonly Money[] {
    if (!Number.isSafeInteger(parts) || parts <= 0) {
        throw new RangeError(`Parts must be a positive integer, got ${parts}`);
    }

    const value = dinero({
        amount: total.minorUnits,
        currency: CURRENCIES[total.currency],
    });

    const ratios = Array.from({ length: parts }, () => 1n);

    return Object.freeze(
        dineroAllocate(value, ratios).map((part) =>
            money(toSnapshot(part).amount, total.currency),
        ),
    );
}

export function applyRate(
    amount: Money,
    rate: {readonly amount: bigint; readonly scale: bigint},
): Money {
    const currency = CURRENCIES[amount.currency];
    const result = transformScale(
        multiply(dinero({amount: amount.minorUnits, currency}), rate),
        currency.exponent,
        halfUp,
    );

    return money(toSnapshot(result).amount, amount.currency);
}

export type { Comparison, CurrencyCode, Money } from "./types.ts";
