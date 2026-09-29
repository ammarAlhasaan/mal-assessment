# Research: Authorizations and Settlements

**Feature**: `002-authorizations-settlements` | **Date**: 2026-09-29

Each item lists the options, the AI's proposal, and the checkpoint that decides it. Nothing here is
approved. No new dependency is researched: Spec 2 uses only the Spec 1 money adapter and ledger.

## R1 — Where holds live (FR-003, FR-012)

**Options**: (a) post holds to the ledger as a separate entry type; (b) keep holds outside the
ledger in an authorization component.

**Proposal**: (b). The assessment defines available balance as "ledger balance minus active holds",
so holds are by definition not part of the ledger balance, and criterion 5 says a hold does not
change it. Option (a) would also require changing Spec 1's ledger (new direction or entry type),
which is out of scope.

## R2 — Available-balance boundary (HC-4)

**Options**:

1. At the authorization's written replay position (entries appended before it).
2. At a day boundary (start or end of the event day).
3. After the whole day's events.

**Proposal**: 1. The stream is "replayed in this order", and the approval rule is evaluated when
the request arrives. Option 2 (start of Day 5) excludes E7 and would approve E8; option 3 is not
available at decision time in a replay. See spec HC-9 sensitivity table.

## R3 — Value day for the ledger balance in a decision (HC-5)

**Options**:

1. Closing balance for the authorization's value day, as known at the boundary.
2. All known entries regardless of value day ("current booked balance").
3. Minimum closing balance over the authorization's value day through Day 6, as known.

**Proposal**: 1 — consistent with Spec 1's closing-balance definition and the overdraft rule's
"closing ledger balance (all entries with value_date ≤ that day)".

**Effect on the stream**: none. At E3, all known entries have value day 1 (250.00 under all three).
At E8, known entries have value days 1–4 and none later, so options 1–3 all give −155.00. The option
still defines the rule for future-dated entries and must be approved.

## R4 — Partial settlement and hold release (HC-1)

**Options**: (a) close the full hold at settlement, releasing the unused amount; (b) reduce the hold
by the settled amount and keep the rest active; (c) keep the full hold until an explicit release.

**Proposal**: (a). The stream has exactly one settlement per authorization and no release or
expiry event, so (b) or (c) would leave AED 15.00 of Auth-A held for the rest of the window with no
way to release it. Card-scheme "final capture" semantics also close the authorization on capture.
(b) changes E8's pre-request available balance to −170.00 (still rejected).

## R5 — Lifecycle representation (HC-13, HC-14)

**Options**:

1. Append-only list of immutable outcome/transition records; state derived by folding history.
2. Mutable map of authorization id → current state, updated in place.
3. Both: records are the source of truth; a private map is a derived cache.

**Proposal**: 1 (3 allowed only as an optimisation, not needed at this scale). Reasons: the
assessment's "no event record is ever mutated or deleted"; Constitution II's pattern (new records,
never edits); "state as known at a boundary" becomes a filter over history, mirroring Spec 1's
`balanceAsKnownAt`; Spec 4 can print per-day authorization states and errors from the same history.

## R6 — Sequence across ledger postings and authorization records (HC-15)

**Options**:

1. One shared replay sequence for ledger entries and authorization records.
2. Separate authorization sequence; each record stores the ledger `lastSequence()` observed when
   recorded.
3. No authorization sequence; order by array position only.

**Proposal**: 2. Option 1 changes the meaning of Spec 1's `lastSequence()` and requires modifying
Spec 1's ledger (out of scope; Spec 1 contract says the sequence counts ledger entries, no gaps).
Option 3 cannot answer "state as known at a ledger boundary". With option 2, a record with stored
ledger boundary *b* is ordered after ledger entries 1…*b* and before *b*+1; a settlement's closing
record stores the boundary that includes its own debit.

## R7 — Settlement consistency without changing Spec 1 (HC-11)

**Facts from Spec 1**: `append` validates before storing and, on failure, stores nothing and consumes
no sequence (Spec 1 contract). Everything is synchronous and in-memory. A `PostingRequest` has no
authorization reference, so the ledger alone cannot record that a hold was closed.

**What can honestly be claimed**: two in-memory stores written one after the other cannot be made
truly atomic without a shared transaction. The achievable guarantee is *failure-atomicity for
anticipated errors*: every anticipated rejection happens before the first write. It is **not**
crash-atomic: an unanticipated fault or a crash after the ledger write and before the history write
leaves a debit with its hold still active.

**Options**:

1. Authorization checks → prepare and freeze the closing record → `ledger.append` → push the record.
2. Push the closing record first, then `ledger.append`; remove the record if `append` throws.
3. Single store or shared transaction covering both writes.

**Proposal**: 1. All anticipated failures occur before any write; construction of the record is
finished before the ledger write, so only a push remains afterwards. Its residual failure mode is
conservative (hold still active → available understated, never overstated) and detectable (a
settlement debit with no closing record). Option 2 needs a delete, which the append-only rule
forbids, and its residual failure (hold closed, no debit) overstates available balance. Option 3
requires changing Spec 1's ledger — out of scope; noted as the production-grade answer for Spec 4's
architecture notes.

## R8 — Rejections and "present" (HC-3, HC-6, HC-12, HC-18, criterion 4)

**Proposal**: an authorization id is "present" once any authorization record for it exists
(approved or rejected, if HC-3 retains rejections). A settlement never creates an authorization
record, so E6 leaves Auth-Z not present. Criterion 4's "not present in the ledger" is read as "not
present in the authorization history", because authorizations are not ledger entries (R1).

## R9 — Validation reuse (HC-7)

**Proposal**: authorization and settlement requests reuse Spec 1's meaning of account, currency,
positive `bigint` amount, and days 1–6. Where possible the Spec 1 error classes are reused (imported,
not modified); a settlement-specific rejection reason covers unknown/non-active authorization,
account/currency mismatch with the authorization, and over-authorization amount. Exact error types
are chosen in the relevant cycle, after approval.

## R10 — Test layout

**Proposal**: `test/authorizations/authorizations.test.ts` for cycles 1–4 (focused cases per
function) and `test/authorizations/authorization-events.test.ts` for cycle 5 (assessment replay),
mirroring Spec 1's `ledger.test.ts` / `foundation-events.test.ts`. Boundaries are captured with
`lastSequence()` during replay, never hard-coded.

## R11 — Shape of `availableBalance()` (HC-20)

**Problem**: if `availableBalance()` is an account-level query that reads the ledger and the
authorization history, cycle 1 can only test it with no holds (no authorization can exist before
`authorize()`), and its hold behaviour would first be exercised — and possibly changed — in cycle 2.
That breaks "complete one function before the next".

**Options**:

1. Pure calculation: `(ledger balance, active hold amounts) → ledger balance − Σ holds`.
2. Account-level query `(account, value day, boundary)` reading ledger and history.
3. Reorder so `authorize()` comes first with an inline available-balance rule.

**Proposal**: 1. It is fully testable in cycle 1 with zero, one, and several holds supplied directly
(synthetic values chosen by the human), including negative results and currency mismatch. It never
changes afterwards. Boundary and value-day selection (HC-4, HC-5) and "which holds are active"
(HC-1, HC-13, HC-15) move to the callers, where they are decided and tested in their own cycles.
Option 2 is the incomplete-cycle problem. Option 3 contradicts the requested function order and
buries the assessment's available-balance definition inside the approval rule.
