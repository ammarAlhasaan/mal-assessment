# Contract: Ledger (`src/ledger/ledger.ts`, `src/ledger/types.ts`)

Depends on the money adapter only. Function bodies are human-owned unless the human explicitly
delegates an accepted review fix, as allowed by the constitution.

## Factory

```ts
function createLedger(accounts: readonly Account[]): Ledger
```

Creates an empty ledger for the given accounts, each opening at zero. Throws
`DuplicateAccountError` if an account id appears more than once. Accounts are copied, so later
changes to the input array do not affect the ledger.

## `Ledger` interface

| Method | Behaviour |
|--------|-----------|
| `append(request: PostingRequest): LedgerEntry` | Copies the posting fields, validates them, assigns `sequence = lastSequence() + 1`, stores and returns a frozen entry (with a frozen `amount`) |
| `appendAll(requests: readonly PostingRequest[]): readonly LedgerEntry[]` | All-or-nothing: copies and validates every request first; if any is invalid nothing is stored and no sequence is consumed. Otherwise appends them in order with consecutive sequences. Used for the three E10 instalments. Does not depend on `this` |
| `entries(accountId?: AccountId): readonly LedgerEntry[]` | Entries in append order (optionally one account); a new array each call |
| `lastSequence(): ReplaySequence` | Last assigned sequence; `0` when empty |
| `balanceByValueDay(accountId, valueDay): Money` | Credits − debits over the account's entries with `valueDay ≤` the requested day |
| `balanceAsKnownAt(accountId, valueDay, boundary): Money` | As above, only entries with `sequence ≤ boundary` |

No method updates or deletes an entry. Only the named posting fields are stored; extra properties on
a request (including a caller-supplied `sequence`) are ignored.

## Validation on `append` / `appendAll`

Checked in this order before anything is stored; on failure nothing is stored and no sequence is
consumed.

| Condition | Error |
|-----------|-------|
| `accountId` not registered | `UnknownAccountError` |
| `amount.currency` ≠ account currency | `AccountCurrencyMismatchError` |
| `amount.minorUnits` not a `bigint`, or `≤ 0` | `InvalidAmountError` |
| `direction` not `CREDIT` or `DEBIT` | `InvalidPostingError` |
| `eventDay` or `valueDay` not an integer from 1 to 6 | `InvalidPostingError` |

## Validation on balance queries

| Condition | Error |
|-----------|-------|
| Unknown account | `UnknownAccountError` |
| `valueDay` not an integer from 1 to 6 | `RangeError` |
| `boundary` not an integer from 0 to `lastSequence()` (`balanceAsKnownAt` only) | `RangeError` |

## Boundaries

Callers capture boundaries with `lastSequence()` at the moment of interest; tests never hard-code
sequence numbers.

- **Before E7**: `lastSequence()` immediately before E7 is appended.
- **End of Day 5, before any fee** (criterion 1): `lastSequence()` after the last entry appended
  before the first Day 6 event (E9). E10 follows E9 in the replay order and is outside this boundary.
  See `AMBIGUITIES.md`.
