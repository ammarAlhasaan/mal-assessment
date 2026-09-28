# Contract: Ledger (`src/ledger/ledger.ts`, `src/ledger/types.ts`)

Depends on the money adapter only. All function bodies are human-owned.

## Factory

```ts
function createLedger(accounts: readonly Account[]): Ledger
```

Creates an empty ledger for the given accounts, each opening at zero.

## `Ledger` interface

| Method | Behaviour |
|--------|-----------|
| `append(request: PostingRequest): LedgerEntry` | Validates, assigns `sequence = lastSequence() + 1`, stores and returns a frozen entry |
| `entries(accountId?: AccountId): readonly LedgerEntry[]` | Entries in append order (optionally one account); a new array each call |
| `lastSequence(): ReplaySequence` | Last assigned sequence; `0` when empty |
| `balanceByValueDay(accountId, valueDay): Money` | Credits − debits over the account's entries with `valueDay ≤` the requested day |
| `balanceAsKnownAt(accountId, valueDay, boundary): Money` | As above, only entries with `sequence ≤ boundary` |

No method updates or deletes an entry.

## Validation on `append`

Checked before anything is stored; on failure nothing is stored and no sequence is consumed.

| Condition | Error |
|-----------|-------|
| `accountId` not registered | `UnknownAccountError` |
| `amount.currency` ≠ account currency | `AccountCurrencyMismatchError` |
| `amount.minorUnits ≤ 0` | `InvalidAmountError` |

Balance queries for an unknown account throw `UnknownAccountError`.

## Boundaries

Callers capture boundaries with `lastSequence()` at the moment of interest (e.g. just before appending
E7, or at the end of Day 5 before any fee). Which moment defines each assessment boundary is decided at
HC-4.
