# Research: Money and Ledger Foundation

**Feature**: `001-ledger-foundation` | **Date**: 2026-09-28

## R1 — Money library: Dinero.js version and packaging

**Decision**: Use `dinero.js@2.0.2`, installed as the single runtime dependency and pinned exactly
(`"dinero.js": "2.0.2"` in `package.json`, resolved in `package-lock.json`).

**Findings (official sources)**:

- 2.x is the stable line: v2.0.0 was released 2026-03-02, followed by v2.0.1 and v2.0.2 (2026-03-13,
  marked "Latest"); npm `latest` dist-tag is `2.0.2`.
  Source: https://github.com/dinerojs/dinero.js/releases
- The former scoped packages (`@dinero.js/core`, `@dinero.js/currencies`,
  `@dinero.js/calculator-bigint`) were removed in the 2.0 line. One package provides the entry points
  `dinero.js`, `dinero.js/currencies`, `dinero.js/bigint`, and `dinero.js/bigint/currencies`. No
  additional package is required for bigint.
  Sources: https://dinerojs.com/guides/precision-and-large-numbers, release notes for v2.0.0-alpha.16.
- `dinero.js@2.0.2` has no dependencies, ships ESM only (`"type": "module"`, `exports` map to
  `dist/esm`), and requires Node.js 20+.
  Source: https://dinerojs.com/getting-started/compatibility
- TypeScript declarations are bundled. Generic types are `Dinero<TAmount, TCurrency>` and
  `DineroCurrency<TAmount, TCurrency>`.
  Source: https://dinerojs.com/guides/currency-type-safety

**Alternatives considered**: `2.0.0-alpha.*` builds (superseded by stable); the scoped
`@dinero.js/*` packages (removed upstream); hand-rolled bigint arithmetic (rejected by the project's
money strategy, which requires the official library behind an adapter).

## R2 — bigint amounts

**Decision**: Import only from `dinero.js/bigint` inside `src/money/`.

**Findings**: `dinero.js/bigint` exports `dinero`, `add`, `subtract`, `compare`, `equal`,
`lessThan`, `greaterThan`, `isNegative`, `isZero`, `allocate`, `toDecimal`, `toSnapshot`, and the
types `Dinero`, `DineroCurrency`, `DineroSnapshot`, etc., backed by a bigint calculator. Currencies
from `dinero.js/currencies` (number-based) must not be mixed with bigint objects.
Sources: https://dinerojs.com/guides/precision-and-large-numbers,
https://dinerojs.com/faq/why-cant-i-use-currencies-with-bigint

**Rationale**: `bigint` removes any risk of floating-point representation and matches the
constitution's "integer minor units" rule directly.

## R3 — Currency definitions

**Decision**: Define AED (`base 10n`, `exponent 2n`) and BHD (`base 10n`, `exponent 3n`) locally in the
adapter with `as const satisfies DineroCurrency<bigint, "AED" | "BHD">` rather than importing them from
`dinero.js/bigint/currencies`.

**Findings**: The library's bigint currency constants have the same numeric values but are typed as
`DineroCurrency<bigint>` (code type `string`), so they carry no literal currency type. The docs also
note that bundled currency data may change between versions.
Sources: https://dinerojs.com/core-concepts/currency, https://dinerojs.com/api/currencies

**Rationale**: The assessment fixes the precision; defining it in one local place makes the rule
explicit, reviewable, and independent of library data updates.

## R4 — Adapter surface and the `Money` value

**Decision**: The adapter exposes a plain, readonly `Money` value
(`{ currency: "AED" | "BHD"; minorUnits: bigint }`) plus functions: `decimalPlaces`, `money`, `zero`,
`format`, `add`, `subtract`, `compare`, `allocateEqually`, and the `CurrencyMismatchError` class. No
Dinero type appears in any exported signature.

**Rationale**: A plain value is easy to assert with `deepStrictEqual`, safe to store in frozen ledger
entries, and keeps Dinero.js an internal detail of `src/money/`. `subtract` is included because a
ledger balance is credits minus debits.

**Alternatives considered**: exporting Dinero objects (leaks the library everywhere); a class wrapping
a private Dinero instance (harder to compare in tests, more code for no Spec 1 benefit).

## R5 — Equal allocation behaviour

**Decision**: `allocateEqually(total, parts)` is implemented on top of Dinero's `allocate` with equal
ratios. The resulting remainder order is confirmed by the human at HC-1.

**Findings**: `allocate(dineroObject, ratios)` returns parts that always sum to the original amount.
In 2.0.0 the remainder is distributed one minor unit at a time to the largest ratio first; with equal
ratios the earlier shares receive the extra units.
Source: https://dinerojs.com/api/mutations/allocate

**Rationale**: Tests assert the adapter contract (sum preserved, spread ≤ 1 minor unit, approved
order), not Dinero's algorithm in general.

## R6 — Currency mismatch handling

**Decision**: The adapter checks currencies itself and throws `CurrencyMismatchError` before calling
Dinero.js.

**Findings**: Dinero's `add`/`compare` throw a generic `Error` ("[Dinero.js] Objects must have the
same currency.") at runtime.
Source: https://dinerojs.com/guides/currency-type-safety

**Rationale**: A project-owned error type keeps callers independent of library messages.

## R7 — Formatting

**Decision**: `format` returns `"<CODE> <amount>"` where `<amount>` has exactly the currency's decimal
places, a leading `-` for negatives, and no thousands separators. Implementation may use Dinero's
`toDecimal`, which returns a decimal string at the currency's scale and works with bigint.
Source: https://dinerojs.com/api/formatting/to-decimal

**Rationale**: Deterministic, locale-independent output suitable for the later per-day report.

## R8 — Ledger design

**Decision**: `createLedger(accounts)` returns a `Ledger` interface with `append`, `entries`,
`lastSequence`, `balanceByValueDay`, and `balanceAsKnownAt`. There are no update or delete
operations. Appended entries are frozen; `entries()` returns a copy.

- `Day` is the literal union `1 | 2 | 3 | 4 | 5 | 6` (the assessment window).
- Replay sequence is a positive integer assigned by the ledger at append (1, 2, 3, …); `lastSequence()`
  returns 0 for an empty ledger.
- Validation errors: `UnknownAccountError`, `AccountCurrencyMismatchError`, `InvalidAmountError`.

**Rationale**: The smallest surface that satisfies FR-008 to FR-014 and lets tests capture boundaries
without guessing sequence numbers.

**Alternatives considered**: storing signed amounts instead of direction (loses the explicit
CREDIT/DEBIT record); using calendar dates (unnecessary for a six-day window).

## R9 — Test tooling

**Decision**: Keep Node's built-in `node:test` runner and `node:assert/strict`, already used by
`npm test`; place tests under `test/money/` and `test/ledger/`.

**Rationale**: No extra dependency; Node runs the TypeScript test files directly.
