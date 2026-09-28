# Contract: Money Adapter (`src/money/money.ts`)

The only module that imports Dinero.js (`dinero.js/bigint`). No exported signature mentions a Dinero
type. Function bodies are human-owned unless the human explicitly delegates an accepted review fix,
as allowed by the constitution.

## Types

```ts
type CurrencyCode = "AED" | "BHD";
interface Money { readonly currency: CurrencyCode; readonly minorUnits: bigint }
type Comparison = -1 | 0 | 1;
class CurrencyMismatchError extends Error {}
class UnsupportedCurrencyError extends Error {}
```

## Functions

| Signature | Behaviour | Errors |
|-----------|-----------|--------|
| `decimalPlaces(currency: CurrencyCode): number` | AED → 2, BHD → 3 | — |
| `money(minorUnits: bigint, currency: CurrencyCode): Money` | Returns a frozen value holding exactly these minor units and currency | `UnsupportedCurrencyError` for a currency other than AED/BHD; `TypeError` if `minorUnits` is not a `bigint` |
| `zero(currency: CurrencyCode): Money` | Zero minor units in `currency` | — |
| `format(amount: Money): string` | `"<CODE> <amount>"`; exactly `decimalPlaces` fraction digits; leading `-` when negative; no thousands separators | — |
| `add(augend: Money, addend: Money): Money` | Exact sum, same currency | `CurrencyMismatchError` |
| `subtract(minuend: Money, subtrahend: Money): Money` | Exact difference, may be negative | `CurrencyMismatchError` |
| `compare(left: Money, right: Money): Comparison` | `-1` less, `0` equal, `1` greater | `CurrencyMismatchError` |
| `allocateEqually(total: Money, parts: number): readonly Money[]` | Frozen array of `parts` values in `total.currency`; sum equals `total` exactly; max − min ≤ 1 minor unit; remainder units go to the earliest parts first (E10 → 3.334, 3.333, 3.333); negative totals allocate the same way with negative parts | `RangeError` if `parts` is not a positive safe integer |

## Guarantees

- No floating-point number ever represents an amount.
- Inputs are never mutated; results are new, frozen values.
- Currency precision comes only from the adapter's `CURRENCIES` table.

## Out of contract

Parsing decimal strings, currency conversion, multiplication/percentages (interest arrives in a
later specification).
