# Feature Specification: Fees, Reversals, and Interest

**Feature Branch**: `003-fees-reversals-interest`
**Created**: 2026-09-29
**Status**: Draft — HC-1–HC-7 and HC-17 approved; HC-8–HC-16 pending
**Input**: "Spec 3 — Fees, Reversals, and Interest: E7, overdraft-fee assessment, E9 reversal in an
append-only ledger, daily interest at 0.04% on positive closing balances, rounded daily accruals and
one capitalized credit at the end of Day 6; acceptance criteria 1, 2, 6, and 8."

## How to read this specification

- **[Assessment]** — stated in `.temp/ASSESSMENT.md`.
- **[Constitution]** — required by `.specify/memory/constitution.md`.
- **[HC-n]** — a human checkpoint below. Nothing marked *proposed* is approved.
- Money is written as `AED 1,200.00 [120000]`: display value, then integer minor units.

Every value in this document is **proposed, pending human approval** (Constitution IV). No value may
enter a test until its checkpoint is ticked in [checklists/human-checkpoints.md](checklists/human-checkpoints.md).

## Scope

In scope:

- E7 — Day 5 — DEBIT — ACC-001 AED 620.00 — value_date Day 2 (already posted by Spec 1; its fee
  effect is new here).
- Overdraft fee: AED 25.00, at most once per account and day, when that day's closing value-dated
  ledger balance is negative; booked with value_date equal to the day assessed **[Assessment]**.
- E9 — Day 6 — REVERSAL — ACC-001 reverses E7 — value_date Day 2, as a compensating entry
  **[Assessment; Constitution II]**.
- Daily interest at 0.04% on positive closing ledger balances, each accrual rounded to the account's
  precision, capitalized as a single credit at the end of Day 6 equal to the exact sum of the rounded
  accruals **[Assessment]**.
- Acceptance criteria 1 (re-check), 2, 6, and 8.

Out of scope: per-day report printing, README, Part 2 architecture, full E1–E10 replay orchestration
(Spec 4), refactoring Spec 1 or Spec 2.

## Assessment Inputs Covered

| Input | Source text | Covered by |
|-------|-------------|------------|
| Overdraft rule | "AED 25.00, assessed once per day per account when that day's closing ledger balance (all entries with value_date ≤ that day) is negative. Booked with value_date equal to the day assessed." | US1, FR-001…FR-004 |
| E7 | "Day 5 — DEBIT — ACC-001 AED 620.00 — value_date Day 2" | US1, US5 |
| E9 | "Day 6 — REVERSAL — ACC-001 reverses E7 — value_date Day 2" | US2, US5 |
| Append-only | "No event record is ever mutated or deleted." | US2, FR-005…FR-007 |
| Interest rule | "0.04% per day on the closing ledger balance, positive balances only. Accruals capitalize as a single credit at end of Day 6. The rounded daily accruals must sum exactly to the capitalized total." | US3, US4, FR-008…FR-012 |
| Precision | "AED is 2 decimal places, BHD is 3. Amounts stored and rounded to their own precision." | US3 |
| Criterion 1 | "The Day 2 closing ledger balance, evaluated at end of Day 5 and before any fee is assessed, is AED −370.00." | US5 (re-check) |
| Criterion 2 | "E7 causes exactly one overdraft fee to be assessed, on Day 2." | US5 — proposed **reject** |
| Criterion 6 | "After E9, all balances and fees return to their pre-E7 values." | US5 — proposed **reject** |
| Criterion 8 | "If the rounded daily interest accruals do not sum to the capitalized total, the remainder is discarded." | US4, US5 — proposed **reject** |

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Overdraft-fee assessment (Priority: P1)

At the end of a day, the ledger books an AED 25.00 fee for every value day up to that day whose
closing balance is negative and which has no fee yet.

**Independent Test**: synthetic ledgers; call the assessment and inspect appended entries.

**Acceptance Scenarios** (synthetic values, approved per cycle):

1. **Given** a negative closing balance on a day with no fee, **When** assessed, **Then** exactly one
   AED 25.00 DEBIT is appended with value day = that day **[Assessment]**.
2. **Given** a zero or positive closing balance, **When** assessed, **Then** no fee **[Assessment]**.
3. **Given** a day already charged, **When** assessed again, **Then** no second fee **[Assessment: once per day]**.
4. **Given** a back-valued debit that makes an earlier day negative, **When** assessed later, **Then**
   the fee's value day is the earlier day and its event day is the assessment day **[Assessment; HC-1]**.
5. **Given** an earlier fee, **Then** later days' closing balances include it **[Assessment: all entries with value_date ≤ that day; HC-2]**.

### User Story 2 — Reversal (Priority: P1)

E9 reverses E7 by appending a compensating entry; E7 is never changed.

1. **Given** a posted debit, **When** reversed, **Then** one CREDIT of the same account and amount is
   appended with the reversal's own event day and value day **[Assessment; Constitution II; HC-6]**.
2. **Then** the target entry is unchanged and still present **[Assessment: append-only]**.
3. **Then** for every value day ≥ the reversal's value day the target's effect nets to zero **[Assessment]**.
4. **Given** an unknown target, **Then** nothing is appended **[Constitution II; HC-7]**.

### User Story 3 — Daily interest accrual (Priority: P1)

1. **Given** a positive closing balance, **Then** accrual = balance × 0.04%, rounded to the currency
   precision **[Assessment; HC-11, HC-12]**.
2. **Given** a zero or negative closing balance, **Then** accrual = 0 **[Assessment: positive balances only]**.

### User Story 4 — Capitalization (Priority: P1)

1. **Given** the rounded accruals for Days 1–6, **When** Day 6 ends, **Then** exactly one CREDIT equal
   to their exact sum is appended with value day 6 **[Assessment; HC-10]**.
2. No remainder is created or discarded **[Assessment; criterion 8 rejected]**.

### User Story 5 — Spec 3 event coverage (Priority: P2)

Replays E1–E10 with end-of-day fee assessment and end-of-Day-6 capitalization (no printing) and
asserts the approved tables in [HC-15](#hc-15--calculation-tables) and the verdicts in HC-14.

### Edge Cases (documented, not implemented unless a checkpoint says so)

- Reversing an event with several entries (e.g. E10), reversing twice, reversing a reversal — no
  assessment event; limitation (HC-7).
- An AED fee on a BHD account — ACC-002 is never negative; limitation (HC-4).
- Capitalization with a zero total — does not occur in the stream (HC-10).

## Requirements *(mandatory)*

- **FR-001** [Assessment]: Fee amount AED 25.00 [2500] as a DEBIT on the charged account.
- **FR-002** [Assessment]: A fee is assessed for value day *d* only when the closing balance for *d*
  (all entries with value day ≤ *d*, including earlier fees) is negative.
- **FR-003** [Assessment]: At most one fee per account and value day, including across repeated assessments.
- **FR-004** [HC-1]: Assessment at the end of day *N* covers every value day 1…*N*; fee value day = the
  charged day, fee event day = *N*.
- **FR-005** [Assessment; Constitution II]: A reversal appends a new entry; no entry is edited or removed.
- **FR-006** [HC-6]: The reversal entry has the opposite direction, the target's account and amount,
  and the reversal event's own id, event day and value day.
- **FR-007** [HC-5]: Fees already booked remain after a reversal; the reversal does not refund them.
- **FR-008** [Assessment]: Daily accrual = closing balance × 4 / 10,000 for positive balances, else 0.
- **FR-009** [Assessment; HC-11]: Each accrual is rounded to the account's precision.
- **FR-010** [HC-9]: Accruals use the final value-dated closing balances known at capitalization.
- **FR-011** [Assessment; HC-10]: One capitalization CREDIT per account at the end of Day 6, value day 6,
  equal to the sum of the six rounded accruals.
- **FR-012** [Constitution I; HC-12]: Rate multiplication and rounding happen in `src/money/`.

## Human Checkpoints *(blocking — resolve before the cycle that needs them)*

### HC-1 — When fees are assessed and whether back-valued entries trigger historical fees

**Approved (2026-09-29, cycle 1)**: Option A.

**Question**: E7 arrives on Day 5 with value day 2. Is Day 2 (and any later day it turns negative)
charged retroactively?

| Option | Rule | Fees from E7 | Criterion 2 |
|--------|------|--------------|-------------|
| **A (proposed)** | At the end of each day *N*, scan value days 1…*N*; charge every negative, uncharged day | Days 2, 4, 5 | reject |
| B | At the end of day *N*, check only day *N* | Day 5 only | reject (one fee, but Day 5) |
| C | At most one fee per *processing* day, earliest negative day | Day 2 only | accept |

**Proposed: A.** "that day's closing ledger balance (all entries with value_date ≤ that day)" defines
the balance by value date, so a back-valued debit changes Day 2's closing balance; "booked with
value_date equal to the day assessed" allows a fee dated Day 2. Criterion 1's own wording ("before
any fee is assessed", evaluated at end of Day 5) implies a Day 2 fee assessed at end of Day 5.
Option C leaves Days 4 and 5 negative without a fee, contradicting the rule. Fee event day = the
assessment day (Day 5), so the ledger shows when the fee became known.

### HC-2 — Fees inside the same assessment run

**Approved (2026-09-29, cycle 1)**: as proposed.

**Proposed**: scan value days in ascending order; a fee booked for an earlier day is included in
later days' closing balances. In this stream the order does not change which days are charged
(Day 3 is AED 30.00 without the Day 2 fee and AED 5.00 with it — positive either way).

### HC-3 — Fee identity and idempotency

**Approved (2026-09-29, cycle 1)**: as proposed.

**Proposed**: stateless `assessOverdraftFees(ledger, accountId, assessmentDay)`; fee event id
`FEE-<accountId>-D<day>` (e.g. `FEE-ACC-001-D2`); a day is already charged when the ledger holds an
entry with that id. Limitation: a non-fee posting using that id would be mistaken for a fee.
Alternative: a stateful fee component like `createAuthorizations`.

### HC-4 — Fee currency

**Approved (2026-09-29, cycle 1)**: as proposed; no dedicated test.

**Proposed**: the rule is written in AED; fees are assessed only for AED accounts. ACC-002 (BHD) is
never negative (0.000 on Days 1–4, 10.000 on Days 5–6), so no BHD fee question arises. Recorded as a
limitation, not tested.

### HC-5 — Fees after E9

**Approved (2026-09-29, cycle 2)**: as proposed; evidenced in cycle 6.

**Proposed**: the three fees stay. The ledger is append-only, the fees were correct on what was known
at the end of Day 5, and the stream contains no fee-refund event. A refund would itself be a new
compensating entry; it is not invented here. The end-of-Day-6 reassessment adds no fee (no negative
day remains).

### HC-6 — Reversal posting

**Approved (2026-09-29, cycle 2)**: as proposed.

**Proposed**: `reverse(ledger, {eventId, targetEventId, eventDay, valueDay})` appends one entry:
opposite direction of the target (CREDIT for E7), target's account and amount (AED 620.00), eventId
`E9`, eventDay 6, valueDay 2 (from E9, which here equals E7's). The reversal relationship exists only
in the input event/request (`targetEventId`). The ledger stores only the resulting compensating
posting and does not persist `targetEventId`; the returned value is that plain `LedgerEntry`.
`PostingRequest`/`LedgerEntry` are **not** extended (no Spec 1 change): the assessment never asks
to query the link later.
Alternative: add an optional `reverses` field to the Spec 1 types (Spec 1 change, `snapshot()` too).

### HC-7 — Reversal target validation

**Approved (2026-09-29, cycle 2)**: the target must match exactly one entry, otherwise `InvalidReversalTargetError` before any append; only the unknown-target case is tested.

**Proposed**: an unknown `targetEventId` is rejected before anything is appended (Constitution II:
validate before append) — one test. Multi-entry targets, a second reversal of the same event, and
reversing a reversal are not in the stream: documented limitations, not tested.

### HC-8 — Authorization decisions after E9

**Proposed**: E8 (Auth-B, rejected at its replay position) is not re-evaluated after E9. Recorded
decisions are final; the reversal changes balances, not past decisions. No code change to Spec 2.

### HC-9 — Which balances earn interest

| Option | Basis | ACC-001 total | ACC-002 total |
|--------|-------|---------------|---------------|
| **A (proposed)** | Final value-dated closing balances known at capitalization (after E9, fees, E10) | AED 0.93 | BHD 0.008 |
| B | Balance as known at the end of each day, never recalculated | AED 0.81 | BHD 0.004 |

**Proposed: A.** Accruals are uncapitalized until the end of Day 6, and the rule defines the closing
balance by value date. Option B would ignore E7/E9's corrections and E10's late arrival for Day 5.

### HC-10 — Accrual days and capitalization entry

**Proposed**: each of Days 1–6 accrues on that day's closing balance **before** capitalization; the
capitalization credit itself earns nothing. Capitalization: one CREDIT per account, eventId
`INT-<accountId>`, eventDay 6, valueDay 6, appended at the final window close after the Day 6 fee
assessment (HC-17). A zero total would append nothing (does not occur here).

### HC-11 — Rounding mode

**Proposed**: round half up (ties away from zero; balances are positive) at the account precision,
per daily accrual. The stream contains no tie (16.6, 15.6, 15.6 minor units), so half-up and
half-even give the same result; round-down would give AED 0.90 instead of 0.93. One synthetic tie
test pins the chosen mode.

### HC-12 — Money-adapter addition

**Proposed**: add one function to `src/money/money.ts`, e.g. `applyRate(amount, rate)` with the rate
as an integer and scale (0.04% = 4 at scale 4), using Dinero `multiply` + `transformScale` + `halfUp`.
This is an **additive** change to a Spec 1 file, required by Constitution I (rounding only in the
adapter). No existing Spec 1 function or test changes.

### HC-13 — End-of-day order

**Superseded by HC-17** (which fixes both when each close runs and what it does).

### HC-14 — Criteria verdicts

| # | Proposed verdict | Reason |
|---|------------------|--------|
| 1 | **Accept** (re-check) | No fee exists before the end-of-Day-5 boundary; 1,200.00 − 950.00 − 620.00 = −370.00 |
| 2 | **Reject** | E7 makes Days 2, 4, 5 negative → three fees (Option A); under Option B the single fee is on Day 5, not Day 2 |
| 6 | **Reject** | E7's principal effect is neutralized, but three retained fees keep balances AED 25.00–75.00 lower and fee entries can never be removed |
| 8 | **Reject** | The capitalized total is defined as the sum of rounded accruals, so no remainder exists; "discarding" one would capitalize AED 0.92 against accruals summing to 0.93 |

### HC-15 — Calculation tables

See [research.md](research.md#r1-calculation-tables). Approve every row before any assertion.

### HC-16 — Scope of the Spec 3 event test

**Proposed**: one scenario test replays E1–E10 in written order with end-of-day fee assessment and
end-of-Day-6 capitalization, and asserts only the HC-15 values and HC-14 verdicts. E10 is included
only for ACC-002 interest. No printing (Spec 4).

### HC-17 — Processing cutoffs (daily close and final window close)

**Approved (2026-09-29, cycle 1)**: as proposed; applied by the replay in cycle 6.

The assessment does not say when end-of-day processing runs relative to the written stream, and the
stream is not in day order: E10 (Day 5) follows E9 (Day 6).

**Proposed**:

1. The written order E1–E10 is never changed; `sequence` is knowledge order, `eventDay` is event
   data, `valueDay` selects the balances affected.
2. **Daily close (Days 1–5)** runs at the day rollover: immediately before the first written event
   with a higher `eventDay`. It assesses fees only (HC-1). The Day 5 close therefore runs after E8
   and before E9 and charges Days 2, 4, 5.
3. **Late arrivals** (E10, event day 5, after E9) do not reopen a closed day. They reach the balances
   through value dates at the next close.
4. **Final window close (Day 6)** runs after the last written event (E10): fee reassessment over
   Days 1–6 (none due after E9), then interest accrual on the final value-dated balances (HC-9) and
   one capitalization credit per account (HC-10). The capitalization credit does not trigger or
   cancel a fee.

**Rejected alternative**: one cutoff after the last event for everything. Fees would be assessed only
after E9 cancelled E7, so no day is negative (ACC-001: 250.00, 250.00, 650.00, 465.00, 465.00,
465.00) and no fee is ever charged. Criterion 1's "before any fee is assessed" would be meaningless,
"assessed once per day" and the per-day fee report would lose their purpose, and interest would be
AED 1.03.

**Precedent** (supplied by the human; consistent with this decision): posting date and value date are
separate (SAP), the event store is append-only and projections are rebuilt from it (AWS event
sourcing), back-dated entries recalculate end-of-day balances from their value date onward (Oracle
Financials), and back-valued interest is recalculated and booked as a separate adjustment (Oracle
FLEXCUBE). None of these delays the daily close; they recalculate affected days afterwards.

All HC-15 values are unchanged under this decision.

## Success Criteria *(mandatory)*

- **SC-001**: Every fee, reversal, and interest value in tests traces to an approved HC-15 row.
- **SC-002**: Criteria 1, 2, 6, 8 each have a recorded verdict with arithmetic; rejections in `REJECTED.md`.
- **SC-003**: No ledger entry is mutated or deleted; E7 is present and unchanged after E9.
- **SC-004**: `npm test` and `npm run typecheck` pass; Spec 1 and Spec 2 tests unchanged.
