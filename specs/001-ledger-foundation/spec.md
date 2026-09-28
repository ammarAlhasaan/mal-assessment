# Feature Specification: Money and Ledger Foundation

**Feature Branch**: `001-ledger-foundation`

**Created**: 2026-09-28

**Status**: Implemented — human checkpoints and red runs confirmed

**Input**: User description: "Build the money adapter and append-only ledger foundation required by the
account-ledger assessment: exact AED/BHD money through a local adapter over Dinero.js (bigint),
immutable append-only credit and debit entries with independent event and value days, replay sequences
assigned at append, balances by value day and as known at a replay-sequence boundary, covering E1, E2,
E4, E7, and E10."

## Scope

**In scope**: money adapter (AED 2 dp, BHD 3 dp, creation from integer minor units, formatting,
same-currency addition and subtraction, comparison, equal allocation); append-only credit and debit
entries; account currency validation; independent event day and value day; replay sequence assigned at
append; balance by value day; balance as known at a replay-sequence boundary; assessment events E1, E2,
E4, E7, E10; acceptance criteria 1 and 7.

**Out of scope** (later specifications): authorizations and holds, settlements, overdraft fees,
reversals, interest, full E1–E10 replay, per-day report output, and the repository documents
(`README.md`, `NUMBERS.md`, `AMBIGUITIES.md`, `REJECTED.md`, `WORKLOG.md`) beyond the entries noted
under Human Checkpoints.

## Assessment Inputs Covered

| Event | Event day | Type   | Account | Amount        | Value day |
|-------|-----------|--------|---------|---------------|-----------|
| E1    | Day 1     | CREDIT | ACC-001 | AED 1,200.00  | Day 1     |
| E2    | Day 1     | DEBIT  | ACC-001 | AED 950.00    | Day 1     |
| E4    | Day 3     | CREDIT | ACC-001 | AED 400.00    | Day 3     |
| E7    | Day 5     | DEBIT  | ACC-001 | AED 620.00    | Day 2     |
| E10   | Day 5     | CREDIT | ACC-002 | BHD 10.000, posted as three equal instalments | Day 5 |

Accounts: ACC-001 (AED, opening 0.00) and ACC-002 (BHD, opening 0.000). The assessment's replay
order lists E10 last, after the Day 6 event E9.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exact money in AED and BHD (Priority: P1)

The ledger needs amounts that are exact in each account's currency: AED with 2 decimal places and BHD
with 3, held as integer minor units, formatted at their own precision, added, subtracted, and compared
only within one currency.

**Why this priority**: Every later calculation (balances, fees, interest) depends on exact money.

**Independent Test**: Exercise the money adapter alone: create, format, add, subtract, and compare AED
and BHD amounts; confirm cross-currency operations are rejected.

**Acceptance Scenarios**:

1. **Given** an amount in integer minor units and a supported currency, **When** it is created,
   **Then** it keeps that exact integer amount and currency.
2. **Given** an AED amount, **When** it is formatted, **Then** it shows exactly 2 decimal places; a BHD
   amount shows exactly 3.
3. **Given** two amounts in the same currency, **When** they are added, subtracted, or compared,
   **Then** the result is exact and in that currency.
4. **Given** amounts in different currencies, **When** they are added, subtracted, or compared,
   **Then** the operation is rejected with a currency-mismatch error.

---

### User Story 2 - Equal allocation for E10 (Priority: P1)

E10 credits BHD 10.000 to ACC-002 as three equal instalments. The amount does not divide evenly into
BHD minor units, so the adapter must split it into three parts that differ by at most one minor unit
and sum exactly to the original total.

**Why this priority**: E10 is the assessment's direct test of rounding without losing or creating
money, and it decides acceptance criterion 7.

**Independent Test**: Allocate the E10 total into three parts through the adapter and check the parts'
sum, spread, and order.

**Acceptance Scenarios**:

1. **Given** BHD 10.000 and three parts, **When** it is allocated equally, **Then** the three parts sum
   exactly to BHD 10.000.
2. **Given** the same allocation, **Then** no two parts differ by more than one minor unit, and any
   remainder units are placed in the order approved at checkpoint HC-1.
3. **Given** acceptance criterion 7 ("each instalment must be BHD 3.334"), **When** it is evaluated
   against scenario 1, **Then** it is refused because three such instalments would not preserve the
   E10 total. Final wording and verdict are approved at HC-1.

---

### User Story 3 - Append-only ledger entries (Priority: P1)

Credits and debits are appended to an in-memory ledger for a known account. Each entry keeps its event
day and value day independently and receives a replay sequence when appended. Entries can never be
changed or removed.

**Why this priority**: Append-only storage is a non-negotiable assessment rule and the base for all
balance questions.

**Independent Test**: Append entries to a fresh ledger and inspect the returned entries, their
sequences, and their immutability; attempt invalid appends.

**Acceptance Scenarios**:

1. **Given** a ledger with ACC-001 (AED), **When** entries are appended, **Then** each receives the next
   replay sequence in append order and keeps the event day and value day it was given.
2. **Given** an appended entry, **When** a caller tries to modify it or the list of entries returned by
   the ledger, **Then** the ledger's stored entries are unchanged.
3. **Given** an entry whose amount currency differs from its account's currency, or an unknown account,
   or a zero/negative amount, **When** it is appended, **Then** it is rejected, nothing is stored, and no
   sequence is consumed.

---

### User Story 4 - Temporal balances (Priority: P2)

The ledger answers two balance questions for an account: the closing ledger balance for a value day
using everything appended so far, and the same balance as it was known at an earlier replay-sequence
boundary.

**Why this priority**: E7 (appended on Day 5 with value day Day 2) changes Day 2's closing balance
after the fact; acceptance criterion 1 depends on evaluating that balance at the correct boundary.

**Independent Test**: Append E1, E2, E4, E7 to ACC-001 and E10 to ACC-002, capture sequence boundaries
while appending, and query both balance functions.

**Acceptance Scenarios**:

1. **Given** E1, E2, E4, and E7 appended to ACC-001, **When** the closing balance for each value day
   Day 1 to Day 6 is requested, **Then** it equals the sum of credits minus debits with value day on or
   before that day (values approved at HC-3).
2. **Given** the boundary captured immediately before E7 was appended, **When** Day 2's balance as known
   at that boundary is requested, **Then** E7 is excluded (value approved at HC-3).
3. **Given** the end-of-Day-5, pre-fee boundary defined at HC-4, **When** Day 2's closing balance as
   known at that boundary is requested, **Then** it is compared against acceptance criterion 1's claim
   of AED −370.00; the claim is accepted (HC-3).
4. **Given** E10 appended to ACC-002 as approved at HC-2, **When** ACC-002's Day 5 closing balance is
   requested, **Then** it equals the E10 total, and ACC-001's balances are unaffected.
5. **Given** an account with no entries, **When** any balance is requested, **Then** it is zero in the
   account's currency.

---

### Edge Cases

- A back-valued entry (value day earlier than event day, as with E7) changes closing balances for its
  value day and every later value day, but not balances as known at earlier boundaries.
- A value day with no entries of its own carries forward the previous closing balance.
- Rejected appends must not leave gaps in the replay sequence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support exactly two currencies, AED with 2 decimal places and BHD with 3,
  defined in one place.
- **FR-002**: The system MUST create money only from integer minor units (`bigint`) and a supported
  currency; floating-point values MUST NOT represent money.
- **FR-003**: The system MUST format money as its currency code followed by the decimal amount with
  exactly the currency's number of decimal places, using a leading `-` for negative amounts and no
  thousands separators.
- **FR-004**: The system MUST add and subtract same-currency amounts exactly and reject different
  currencies.
- **FR-005**: The system MUST compare same-currency amounts (less, equal, greater) and reject different
  currencies.
- **FR-006**: The system MUST split an amount into N equal parts whose sum equals the original amount
  exactly and whose parts differ by at most one minor unit.
- **FR-007**: Application and ledger code MUST depend only on the local money adapter; only
  `src/money/` may import Dinero.js.
- **FR-008**: The ledger MUST accept CREDIT and DEBIT entries for registered accounts and reject
  entries whose currency differs from the account's currency, entries for unknown accounts, entries
  whose amount is not a positive `bigint`, entries with any other direction, and entries whose event
  day or value day is not an integer from 1 to 6. Duplicate account ids MUST be rejected at creation.
- **FR-009**: Each entry MUST store its event day and value day independently, plus the originating
  event identifier.
- **FR-010**: The ledger MUST assign each appended entry the next replay sequence (starting at 1);
  callers MUST NOT supply sequences.
- **FR-011**: The ledger MUST be append-only: no operation updates or deletes entries, and entries and
  entry lists handed to callers MUST NOT allow the stored ledger to be changed.
- **FR-012**: The ledger MUST report the last assigned replay sequence (0 when empty) so callers can
  capture boundaries.
- **FR-013**: The ledger MUST return an account's closing ledger balance for a value day as credits
  minus debits over all entries with value day on or before that day.
- **FR-014**: The ledger MUST return an account's closing ledger balance for a value day as known at a
  replay-sequence boundary, considering only entries with sequence at or before the boundary.
- **FR-015**: E10 MUST be posted to ACC-002 as three CREDIT entries whose amounts come from the
  adapter's equal allocation, appended together with `appendAll` (HC-2).
- **FR-016**: The ledger MUST support appending a batch of entries atomically: if any entry in the
  batch is invalid, nothing is stored and no sequence is consumed.
- **FR-017**: Balance queries MUST reject value days outside 1–6 and boundaries outside
  0…last sequence instead of returning a misleading balance.

### Key Entities

- **Money**: an exact amount — integer minor units plus a currency code (AED or BHD).
- **Account**: identifier and currency. Both assessment accounts open at zero.
- **Posting request**: what a caller asks to append — event id, account, direction (CREDIT/DEBIT),
  positive amount, event day, value day.
- **Ledger entry**: an accepted posting request plus its replay sequence; immutable.
- **Replay sequence / boundary**: positive integer assigned at append; a boundary selects the entries
  known at that point.
- **Day**: an integer day in the assessment window, Day 1 to Day 6.

## Human Checkpoints *(blocking — resolve before writing assertions)*

The approved checkpoints are encoded in the human-approved tests. The values below are copied from
those tests (`test/money/money.test.ts`, `test/ledger/foundation-events.test.ts`) and from
`AMBIGUITIES.md` / `REJECTED.md`.

### HC-1 — E10 allocation

| Instalment | Amount (BHD) |
|------------|--------------|
| 1          | 3.334 |
| 2          | 3.333 |
| 3          | 3.333 |
| Sum        | 10.000 |

- Order of remainder units: from the first instalment onward.
- Criterion 7: **rejected** — three instalments of BHD 3.334 total BHD 10.002 and would create
  BHD 0.002. Recorded in `REJECTED.md`.

### HC-2 — How the three E10 instalments are posted to ACC-002

- Three CREDIT entries to ACC-002, each with event id `E10`.
- Event day 5 and value day 5 on each entry.
- Appended together with `appendAll` in allocation order (3.334, 3.333, 3.333), in the written replay
  position after E9; the ledger is never reordered by date. Recorded in `AMBIGUITIES.md`.

### HC-3 — E1/E2/E4/E7 temporal balances (ACC-001)

| Value day | Closing balance, all Spec 1 entries | As known before E7 appended |
|-----------|-------------------------------------|-----------------------------|
| Day 1     | 250.00  | 250.00 |
| Day 2     | −370.00 | 250.00 |
| Day 3     | 30.00   | 650.00 |
| Day 4     | 30.00   | 650.00 |
| Day 5     | 30.00   | 650.00 |
| Day 6     | 30.00   | 650.00 |

ACC-002 by value day: 0.000 on Days 1–4, 10.000 on Days 5–6.

- Criterion 1: **accepted within Spec 1** — Day 2 closing balance as known at the end-of-Day-5,
  pre-fee boundary is AED −370.00 (1,200.00 − 950.00 − 620.00). Re-check once authorizations,
  settlements, and fees exist. Recorded in `AMBIGUITIES.md`.

### HC-4 — Replay-sequence boundaries

- "Before E7": `lastSequence()` immediately before E7 is appended.
- "End of Day 5, before any fee": `lastSequence()` after the last entry appended before the first
  Day 6 event (E9). E10 follows E9 in the replay order and is outside it; it posts to ACC-002, so it
  cannot affect criterion 1.
- Tests capture boundaries with `lastSequence()` while appending; no sequence numbers are hard-coded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All money and ledger tests for this specification pass, and `npm run typecheck` reports
  no errors.
- **SC-002**: A search of `src/` finds Dinero.js imported only under `src/money/`.
- **SC-003**: The E10 allocation test shows the three instalments sum exactly to the E10 total.
- **SC-004**: Every balance assertion for E1, E2, E4, E7, and E10 matches a value recorded at HC-2/HC-3.
- **SC-005**: No test or source file contains an unapproved expected financial value.

## Assumptions

- Days are the integers 1–6 of the assessment window; no calendar dates are needed.
- Both accounts open at zero, so no opening-balance entry is posted.
- Amounts enter the system as integer minor units; parsing decimal strings is not needed in Spec 1.
- Entries carry the originating event id (e.g. `E10`); multiple entries may share one event id.
- The replay sequence counts ledger entries, not assessment events; Spec 1 appends only the events it
  covers, so tests capture boundaries rather than assuming event numbers.
