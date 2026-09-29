# Data Model: Authorizations and Settlements

**Feature**: `002-authorizations-settlements` | **Date**: 2026-09-29

Conceptual model only. No TypeScript types are defined here; minimum types are added one function
cycle at a time (see [tasks.md](tasks.md)). Fields marked *pending HC-n* may change. Spec 1 entities
(`Money`, `Account`, `PostingRequest`, `LedgerEntry`, `Day`, `ReplaySequence`) are reused unchanged —
see [../001-ledger-foundation/data-model.md](../001-ledger-foundation/data-model.md).

## Authorization request (input)

| Field | Meaning | Rules |
|-------|---------|-------|
| event id | Assessment event, e.g. `E3` | — |
| authorization id | e.g. `Auth-A` | Duplicate handling *pending HC-6* |
| account id | e.g. `ACC-001` | Must be a registered ledger account *(pending HC-7)* |
| hold amount | `Money` | Account currency; positive `bigint` minor units *(pending HC-7)* |
| event day | Day 1–6 | When the request arrives |
| value day | Day 1–6 | Recorded independently; effect on holds *pending HC-5* |

## Settlement request (input)

| Field | Meaning | Rules |
|-------|---------|-------|
| event id | e.g. `E5` | — |
| authorization id | Referenced authorization, e.g. `Auth-A`, `Auth-Z` | Must be present and active *(HC-18)* |
| account id | e.g. `ACC-001` | Must match the authorization *(pending HC-7)* |
| amount | `Money` | Currency matches the authorization; ≤ hold *(pending HC-8)* |
| event day | Day 1–6 | Becomes the debit's event day *(pending HC-17)* |
| value day | Day 1–6 | Becomes the debit's value day *(pending HC-17)* |

## Authorization record (history — proposed, pending HC-13, HC-14, HC-15)

An immutable record appended once per incoming authorization or settlement outcome. Never updated or
deleted.

| Field | Meaning |
|-------|---------|
| record sequence | Strictly increasing, assigned by the authorization component *(HC-15)* |
| ledger boundary | Ledger `lastSequence()` observed when the record was appended *(HC-15)* |
| event id, event day, value day | From the incoming request |
| authorization id, account id, amount | From the incoming request |
| kind | Authorization approved · authorization rejected · settlement accepted · settlement rejected *(HC-2, HC-3, HC-14)* |
| reason | For rejections only, e.g. insufficient available balance, unknown authorization *(HC-3, HC-14)* |
| ledger entry sequence | For an accepted settlement: the sequence of its ledger debit *(HC-11, HC-17)* |

## Authorization (derived, not stored as mutable state — proposed, HC-13)

Folded from the records for one authorization id, optionally only records known at a boundary.

| Derived field | Rule |
|---------------|------|
| present | At least one authorization record exists for the id *(HC-3; research R8)* |
| state | Approved (active) · Rejected · Settled *(HC-2)* |
| hold amount | Requested amount of the approving record |
| hold active | State is Approved and no accepted settlement record follows *(HC-1)* |

## State transitions (proposed, pending HC-1, HC-2, HC-6, HC-8, HC-18)

```text
authorization request ──validate──▶ available − hold ≥ 0 ? ──yes──▶ [Approved, hold active]
          │                                    │
          │                                    └──no───▶ [Rejected]  (no hold, no ledger entry)
          └──invalid / duplicate id──▶ rejected outcome (HC-6, HC-7)

[Approved] ──accepted settlement (amount ≤ hold, same account & currency)──▶ [Settled, hold closed]
                     │ ledger DEBIT appended first; closing record appended only after it succeeds
                     │
                     └──rejected settlement──▶ [Approved] unchanged (no ledger entry)

settlement for an id not present ──▶ rejected outcome; no authorization created; ledger unchanged
[Rejected] / [Settled] ──any settlement──▶ rejected outcome (HC-18)
```

There is no transition out of Rejected or Settled.

## Derived values

- **Active holds** `(account, boundary)` = Σ hold amounts of authorizations for the account whose
  hold is active as known at the boundary *(HC-4, HC-5, HC-15)*.
- **Available balance** `(ledger balance, active hold amounts)` = ledger balance − Σ active hold
  amounts **[Assessment]**. Pure calculation over given inputs *(pending HC-20)*; it does not read
  the ledger or the history.
- **Available balance for a decision** = available balance `(Spec 1 closing balance (account, value
  day, boundary), active holds (account, boundary))` — the caller selects both inputs *(HC-4, HC-5,
  HC-15)*.
- **Approval test** = available balance for the decision − requested hold ≥ 0 **[Assessment]**.

## Invariants

- No authorization or settlement record is mutated or deleted.
- An authorization decision never appends a ledger entry.
- A rejected settlement never appends a ledger entry and never consumes a ledger sequence.
- An accepted settlement appends exactly one ledger DEBIT and exactly one closing record. Every
  anticipated rejection is detected before either write, so it records neither. This is
  failure-atomicity for anticipated errors only, not crash-atomicity: an unanticipated fault between
  the ledger write and the history write could leave the debit with the hold still active (spec
  HC-11).
- Spec 1 ledger entries are never modified by this component.
