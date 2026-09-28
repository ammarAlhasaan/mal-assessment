# Data Model: Money and Ledger Foundation

**Feature**: `001-ledger-foundation` | **Date**: 2026-09-28

## Money (`src/money/money.ts`)

| Field        | Type                 | Rules |
|--------------|----------------------|-------|
| `currency`   | `"AED" \| "BHD"`     | Supported currencies only |
| `minorUnits` | `bigint`             | Integer minor units; may be negative (e.g. a balance) |

- Precision: AED → 2 decimal places, BHD → 3. Defined once in the adapter's `CURRENCIES` table.
- Money values are frozen; operations return new frozen values. `money()` rejects unsupported
  currencies and non-`bigint` minor units.
- Operations on two values require the same `currency`.

## Account (`src/ledger/types.ts`)

| Field      | Type           | Rules |
|------------|----------------|-------|
| `id`       | `AccountId` (`string`) | Unique within a ledger (`DuplicateAccountError` otherwise) |
| `currency` | `CurrencyCode` | Every entry for the account must use this currency |

Assessment accounts: `ACC-001` (AED), `ACC-002` (BHD). Both open at zero; no opening entry is posted.

## PostingRequest

| Field       | Type                    | Rules |
|-------------|-------------------------|-------|
| `eventId`   | `EventId` (`string`)    | Originating assessment event, e.g. `E7`; may repeat (E10 instalments) |
| `accountId` | `AccountId`             | Must be a registered account |
| `direction` | `"CREDIT" \| "DEBIT"`   | Sign is carried by direction, not by amount; any other value is rejected |
| `amount`    | `Money`                 | Currency = account currency; `minorUnits` is a `bigint` and `> 0` |
| `eventDay`  | `Day` (`1`–`6`)         | Day the ledger learns of the event |
| `valueDay`  | `Day` (`1`–`6`)         | Day the entry affects balances; independent of `eventDay` |

## LedgerEntry

`PostingRequest` plus:

| Field      | Type              | Rules |
|------------|-------------------|-------|
| `sequence` | `ReplaySequence`  | Assigned by the ledger at append: 1, 2, 3, … with no gaps |

- Frozen at creation. Never updated or deleted.

## Ledger (state)

- Registered accounts (fixed at creation).
- Ordered list of `LedgerEntry` values, in append (= sequence) order.
- Last assigned sequence (0 when empty).

## Validation and state transitions

```text
PostingRequest ──copy──▶ validate ──▶ accepted ──▶ LedgerEntry(sequence = last + 1), frozen, stored
                               │
                               └──▶ rejected (UnknownAccountError | AccountCurrencyMismatchError |
                                              InvalidAmountError | InvalidPostingError);
                                    ledger and sequence unchanged

PostingRequest[] ──copy all──▶ validate all ──▶ all accepted ──▶ stored in order, consecutive sequences
                                      │
                                      └──▶ any rejected ──▶ nothing stored, sequence unchanged
```

There is no transition out of "stored".

## Derived values

- **Closing balance by value day** `(account, D)` = Σ credit amounts − Σ debit amounts over the
  account's entries with `valueDay ≤ D`; zero in the account currency if none.
- **Closing balance as known at boundary** `(account, D, B)` = the same sum restricted to entries with
  `sequence ≤ B`.
