# Data Model: Authorizations and Settlements

**Feature**: `002-authorizations-settlements` | **Date**: 2026-09-29

This conceptual model reflects the implemented Spec 2 types. Spec 1 entities
(`Money`, `Account`, `PostingRequest`, `LedgerEntry`, `Day`, `ReplaySequence`) are reused unchanged —
see [../001-ledger-foundation/data-model.md](../001-ledger-foundation/data-model.md).

## Authorization request (input)

| Field | Meaning | Rules |
|-------|---------|-------|
| event id | Assessment event, e.g. `E3` | — |
| authorization id | e.g. `Auth-A` | Duplicate handling is outside the supplied stream (HC-6) |
| account id | e.g. `ACC-001` | Ledger balance lookup supplies the account validation used by the assessment path |
| hold amount | `Money` | Exact minor-unit amount through the money adapter |
| event day | Day 1–6 | When the request arrives |
| value day | Day 1–6 | Selects the ledger balance used at the request's replay position (HC-5) |

## Settlement request (input)

| Field | Meaning | Rules |
|-------|---------|-------|
| event id | e.g. `E5` | — |
| authorization id | Referenced authorization, e.g. `Auth-A`, `Auth-Z` | Must be present and active *(HC-18)* |
| account id | e.g. `ACC-001` | Account mismatch is a documented unsupported case (HC-7) |
| amount | `Money` | Over-settlement is a documented unsupported case (HC-8) |
| event day | Day 1–6 | Becomes the debit's event day (HC-17) |
| value day | Day 1–6 | Becomes the debit's value day (HC-17) |

## Stored outcome records

Authorization outcomes and accepted settlements are immutable records and are never updated or
deleted. Rejected settlements are returned but not stored (HC-14).

| Field | Meaning |
|-------|---------|
| event id, event day, value day | From the incoming request |
| authorization id, account id, amount | From the incoming request |
| outcome | `APPROVED`, `REJECTED`, or `SETTLED` |

## Authorization state (derived, HC-13)

Derived from the latest stored record for one authorization id.

| Derived field | Rule |
|---------------|------|
| present | At least one authorization record exists for the id *(HC-3; research R8)* |
| state | Approved (active) · Rejected · Settled *(HC-2)* |
| hold amount | Requested amount of the approving record |
| hold active | State is Approved and no accepted settlement record follows *(HC-1)* |

## State transitions

```text
authorization request ──▶ available − hold ≥ 0 ? ──yes──▶ [Approved, hold active]
                                         │
                                         └──no───▶ [Rejected] (no hold, no ledger entry)

[Approved] ──accepted assessment settlement──▶ [Settled, hold closed]
                     │ ledger DEBIT appended first; closing record appended only after it succeeds
                     │
                     └──rejected settlement──▶ [Approved] unchanged (no ledger entry)

settlement for an id not present ──▶ rejected outcome; no authorization created; ledger unchanged
[Rejected] / [Settled] ──any settlement──▶ rejected outcome (HC-18)
```

There is no transition out of Rejected or Settled.

## Derived values

- **Active holds** = Σ amounts whose latest stored outcome for the account is `APPROVED`.
- **Available balance** `(ledger balance, active hold amounts)` = ledger balance − Σ active hold
  amounts **[Assessment]**. Pure calculation over given inputs (HC-20); it does not read
  the ledger or the history.
- **Available balance for a decision** = available balance `(Spec 1 closing balance (account, value
  day at the written replay position), active holds at that position)` (HC-4/HC-5).
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
