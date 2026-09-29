# Contract: Authorizations (`src/authorizations/` — proposed, not created)

**Status**: Draft. Responsibilities only. No TypeScript signatures are fixed here: the minimum types
and a throwing signature are added at the start of each function cycle, after its checkpoints are
approved, and this contract is then updated to match (Constitution IV). Contains no expected
financial values.

Depends on `src/ledger/` (public `Ledger` interface only) and `src/money/`. Function bodies are
human-owned unless the human explicitly delegates an accepted review fix.

## Component

An authorization component is bound to exactly one existing `Ledger`. It reads balances through
`balanceByValueDay` / `balanceAsKnownAt` / `lastSequence` and writes only through `append`. It never
modifies or reorders ledger entries.

## Operations (in proposed implementation order)

### 1. `availableBalance()`

| Aspect | Contract |
|--------|----------|
| Shape | Pure calculation over given inputs (HC-20, approved) — does not read the ledger or the authorization history |
| Signature | `availableBalance(ledgerBalance: Money, activeHolds: readonly Money[]): Money` |
| Validation | Hold amounts are not validated here; `authorize()` owns that (HC-7) |
| Inputs | one ledger balance (`Money`); the amounts of the active holds (`Money` values, possibly none) |
| Output | `Money` in the ledger balance's currency; may be negative |
| Rule | Ledger balance − Σ active hold amounts **[Assessment]** |
| Errors | A hold in a different currency from the ledger balance → the money adapter's currency-mismatch error |
| Side effects | None; inputs are not modified |
| Not its job | Choosing the ledger boundary / value day (HC-4, HC-5) or deciding which holds are active (HC-1, HC-13, HC-15) — done by its callers |
| Complete after | Cycle 1; no later cycle changes its behaviour |

### 2. `authorize()`

Implemented as `createAuthorizations(ledger: Ledger): Authorizations` with `authorize(request: AuthorizationRequest): AuthorizationRecord` (`src/authorizations/types.ts`). The record is the frozen request plus `outcome: "APPROVED" | "REJECTED"`. Ledger balance: `balanceByValueDay(account, request.valueDay)` at call time (HC-4, HC-5). Duplicate IDs and invalid input are not handled (HC-6, HC-7).

| Aspect | Contract |
|--------|----------|
| Inputs | authorization request (see [data-model.md](../data-model.md)) |
| Output | the decision (approved or rejected, with reason) — *shape pending HC-3, HC-14* |
| Rule | Approve iff available balance − hold ≥ 0 **[Assessment]**, where available balance = `availableBalance()` applied to the ledger balance and active holds it selects at the request's boundary (*HC-4, HC-5, HC-15*) |
| Effects on approval | Hold becomes active; one immutable record appended (*HC-13*) |
| Effects on rejection | No hold; record retained or not per *HC-3/HC-14* |
| Never | Appends a ledger entry or changes a ledger balance **[Assessment]** |
| Invalid input | Unknown account, currency mismatch, non-positive amount, day outside window, duplicate id — *handling pending HC-6, HC-7* |

### 3. Authorization lookup and derived current state

Implemented as `lookup(authorizationId: string): AuthorizationRecord | undefined` on `Authorizations`. Returns the latest record for the id (its `outcome` is the current state), or `undefined` when the id is not present. No boundary parameter (HC-15 deferred).

| Aspect | Contract |
|--------|----------|
| Responsibility | For an authorization id: whether it is present; if present, its account, hold amount, current state, and whether its hold is active |
| Derivation | Computed from the immutable history, not from mutable state (*HC-13*) |
| Boundary | May answer "as known at" a boundary (*HC-15*) |
| Not present | Distinguishable from every present state (needed for E6 / criterion 4) |
| Side effects | None |

### 4. `settle()`

Implemented as `settle(request: SettlementRequest): SettlementRecord` on `Authorizations` (`SettlementRequest` = `AuthorizationRequest`; outcome `"SETTLED" | "REJECTED"`). Unknown id → `REJECTED`, nothing written, not stored. Otherwise: one DEBIT with the settlement's event id, account, amount, event day, value day; then a `SETTLED` record is appended, which closes the whole hold (HC-1). `lookup` may now return a `SettlementRecord`. A rejected or already-settled authorization → `REJECTED`, nothing written (HC-18). Account/currency mismatch and over-settlement are not handled (HC-7, HC-8).

| Aspect | Contract |
|--------|----------|
| Inputs | settlement request (see [data-model.md](../data-model.md)) |
| Output | the outcome (accepted with its ledger entry, or rejected with reason) — *shape pending HC-14* |
| Accept when | Authorization's latest outcome is `APPROVED` (HC-18). Account/currency match and amount ≤ hold are not checked (*HC-7, HC-8 — not handled*) |
| Effects on acceptance | Exactly one ledger DEBIT via `append` (*fields pending HC-17*); hold closed (*HC-1*). Failure-atomic for anticipated errors: every anticipated rejection is detected before the first write, so it records neither; not crash-atomic (*HC-11*) |
| Effects on rejection | No ledger entry; ledger `lastSequence()` unchanged; authorization unchanged; record retained or not per *HC-14* |
| Unknown id | Rejected without moving funds **[Assessment, criterion 4 — verdict HC-10]** |

## Ordering and boundaries

- Callers capture ledger boundaries with `lastSequence()` during replay; tests never hard-code
  sequence numbers (as in Spec 1).
- Authorization-record ordering relative to ledger entries: *pending HC-15*.

## Invariants (all operations)

- No recorded authorization or settlement outcome is mutated or deleted.
- Holds never appear in the ledger.
- No Dinero.js import in `src/authorizations/`.
