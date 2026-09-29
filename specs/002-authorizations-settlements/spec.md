# Feature Specification: Authorizations and Settlements

**Feature Branch**: `002-authorizations-settlements`

**Created**: 2026-09-29

**Status**: Draft — human checkpoints HC-1…HC-20 open. Checkpoints are decided cycle by cycle,
immediately before the function cycle they gate (see [tasks.md](tasks.md)); a cycle's assertions may
be written once its own checkpoints are approved.

**Input**: User description: "Authorizations and settlements for the account-ledger assessment:
available balance as ledger balance minus active authorization holds; approve an authorization only
when available balance stays at or above zero after the hold; authorization lookup, state, and
active holds; settlement behaviour and hold release; E3, E5, E6, E8; Auth-B never settled inside the
six-day window; acceptance criteria 3, 4, and 5."

## How to read this specification

Every requirement and value below is tagged with its source:

- **[Assessment]** — stated directly in `.temp/ASSESSMENT.md`. Normative.
- **[Proposed — HC-n]** — an AI-drafted interpretation that fills a gap in the assessment. It is
  **not** normative until the human approves checkpoint HC-n. It must not appear in a test, a
  contract, or code until then.
- **[Constitution]** — required by `.specify/memory/constitution.md` v1.1.0.

Every financial value in this document is **pending human approval** and is shown with its
event-by-event calculation. No value here is approved.

## Scope

**In scope**:

- Available balance = ledger balance − active authorization holds **[Assessment]**.
- Authorization approval: approve only when available balance, after applying the requested hold,
  is at or above zero **[Assessment]**.
- Authorization lookup, derived authorization state, and active holds.
- Settlement of an authorization, the ledger debit it creates, and release of its hold.
- Rejection of a settlement whose authorization is unknown, without moving funds **[Assessment,
  criterion 4]**.
- Assessment events E3, E5, E6, E8 (ACC-001), replayed in the written order with the Spec 1 ledger
  events that precede them (E1, E2, E4, E7) as context.
- The statement that Auth-B is never settled inside the six-day window **[Assessment]**.
- Acceptance criteria 3, 4, and 5 (verdicts pending HC-10).
- Re-check of criterion 1 now that settlements post to the ledger (pending HC-19), as required by
  the Spec 1 note in `AMBIGUITIES.md`.

**Out of scope** (later specifications or not required):

- Overdraft fees, and any fee effect on available balance (Spec 3).
- E9 reversal and any re-evaluation of earlier authorization decisions after E9 (Spec 3/4).
- Interest and capitalization (Spec 3).
- Per-day report output and the full E1–E10 replay delivery (Spec 4).
- E10 / ACC-002 (already covered by Spec 1; no authorization touches ACC-002).
- Authorization expiry, cancellation, partial or multiple settlements, and incremental
  authorizations (not in the assessment stream).
- Any change to completed Spec 1 code, tests, or documentation, and unrelated refactoring.

## Assessment Inputs Covered

| Event | Event day | Type | Account | Reference | Amount | Value day |
|-------|-----------|------|---------|-----------|--------|-----------|
| E3 | Day 2 | AUTHORIZATION | ACC-001 | Auth-A | AED 200.00 hold | Day 2 |
| E5 | Day 4 | SETTLEMENT | ACC-001 | Auth-A | AED 185.00 | Day 4 |
| E6 | Day 4 | SETTLEMENT | ACC-001 | Auth-Z (no preceding authorization) | AED 180.00 | Day 4 |
| E8 | Day 5 | AUTHORIZATION | ACC-001 | Auth-B | AED 90.00 hold | Day 5 |

Ledger context (Spec 1, already implemented, replayed unchanged):

| Event | Event day | Type | Account | Amount | Value day |
|-------|-----------|------|---------|--------|-----------|
| E1 | Day 1 | CREDIT | ACC-001 | AED 1,200.00 | Day 1 |
| E2 | Day 1 | DEBIT | ACC-001 | AED 950.00 | Day 1 |
| E4 | Day 3 | CREDIT | ACC-001 | AED 400.00 | Day 3 |
| E7 | Day 5 | DEBIT | ACC-001 | AED 620.00 | Day 2 |

Written replay order for ACC-001 within Spec 2: E1, E2, E3, E4, E5, E6, E7, E8. E9 (out of scope)
and E10 (ACC-002) follow.

Auth-B is never settled inside the window **[Assessment]**.

Acceptance criteria owned by this specification **[Assessment]**:

3. The Day 4 settlement of Auth-A must be accepted.
4. Any settlement referencing an authorization ID not present in the ledger must be rejected and the
   funds must not leave the account.
5. If Auth-B is approved, its hold reduces available balance but not ledger balance.

The assessment states that some criteria are wrong. The verdict for each of 3, 4, and 5 is pending
HC-10.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Available balance (Priority: P1)

Available balance is the ledger balance minus the active holds. It is a calculation over two given
inputs, a ledger balance and the amounts of the holds that are active, and it never changes the
ledger balance. Choosing *which* ledger balance (boundary, value day) and *which* holds are active is
the caller's job (`authorize()`, the replay), not this calculation's **[Proposed — HC-20]**.

**Why this priority**: The approval rule and criterion 5 are both defined in terms of available
balance; nothing else in this specification can be decided without it.

**Independent Test**: Give a ledger balance and zero, one, or several hold amounts directly — no
authorization needs to exist — and check the result. The function is complete after this cycle; no
later cycle changes its behaviour.

**Acceptance Scenarios**:

1. **Given** a ledger balance and no active holds, **When** available balance is calculated,
   **Then** it equals the ledger balance **[Assessment]**.
2. **Given** a ledger balance and one active hold, **When** available balance is calculated,
   **Then** it equals ledger balance minus the hold, and the ledger balance given as input is
   unchanged **[Assessment; criterion 5 rule]**.
3. **Given** several active holds, **Then** available balance equals ledger balance minus their sum
   **[Assessment: "minus active holds"]**.
4. **Given** holds larger than the ledger balance, **Then** the result is negative, not clamped
   **[Assessment: approval test needs the signed value]**.
5. **Given** a hold in a different currency from the ledger balance, **Then** the calculation is
   rejected with the money adapter's currency-mismatch error **[Constitution I]**.

Values used in these tests are chosen and approved by the human in cycle 1; they are synthetic and
do not need any assessment checkpoint. Which holds count as "active" at a given point (for example
after a settlement, HC-1) is decided by the authorization history in cycles 2–4, not here.

---

### User Story 2 - Authorization approval (Priority: P1)

An authorization request places a hold on an account. It is approved only if the account's
available balance, after the requested hold is applied, remains at or above zero; otherwise it is
rejected and places no hold.

**Why this priority**: It is a non-negotiable assessment rule and decides E3 and E8.

**Independent Test**: Request authorizations against a ledger whose balance is known; check the
approval decision, the resulting hold, and that no ledger entry is created.

**Acceptance Scenarios**:

1. **Given** available balance B and a request for hold H, **When** B − H ≥ 0, **Then** the
   authorization is approved and H becomes an active hold **[Assessment]**.
2. **Given** available balance B and a request for hold H, **When** B − H < 0, **Then** the
   authorization is rejected and no hold is placed **[Assessment]**.
3. **Given** B − H = 0 exactly, **Then** the authorization is approved **[Assessment: "at or above
   zero"]**.
4. **Given** any authorization decision, **Then** no ledger entry is appended and the ledger's last
   replay sequence is unchanged **[Assessment: a hold affects available balance, not ledger
   balance]**.
5. **Given** E1, E2 replayed, **When** E3 (Auth-A, AED 200.00) is requested, **Then** it receives the
   decision approved at HC-16 (proposed: approved).
6. **Given** E1–E7 replayed in written order, **When** E8 (Auth-B, AED 90.00) is requested, **Then**
   it receives the decision approved at HC-9 (proposed: rejected — see HC-9 calculation).
7. How a rejected request is retained, and how duplicate IDs and currency/account mismatches are
   handled, are pending HC-3, HC-6, HC-7, HC-14.

---

### User Story 3 - Authorization lookup and state (Priority: P2)

Given an authorization ID, the system answers whether it exists, which account and amount it
belongs to, its current state, and whether its hold is active.

**Why this priority**: Settlement depends on it (E5, E6), criterion 4 is stated in terms of an ID
being "present", and Spec 4's per-day report must print authorization states.

**Independent Test**: After a sequence of authorization and settlement events, look up known and
unknown IDs and compare their derived state with the history that produced it.

**Acceptance Scenarios**:

1. **Given** an approved authorization, **When** it is looked up, **Then** its state is the approved
   active state and its hold amount is the requested amount **[Proposed — HC-2]**.
2. **Given** an ID with no preceding authorization (Auth-Z), **When** it is looked up, **Then** the
   result states that it is not present **[Assessment: E6 note]**.
3. **Given** a settled authorization, **When** it is looked up, **Then** its state is the closed
   (settled) state and its hold is no longer active **[Proposed — HC-1, HC-2]**.
4. **Given** the authorization history at an earlier replay boundary, **When** state is derived at
   that boundary, **Then** it reflects only the transitions known then **[Proposed — HC-13, HC-15]**.

The exact name and return shape of the lookup operation are deliberately not fixed here; they depend
on HC-2, HC-3, HC-13, and HC-14.

---

### User Story 4 - Settlement and hold release (Priority: P1)

A settlement references an authorization. If accepted, it debits the settled amount to the ledger
and closes the authorization's hold in one indivisible step. If rejected, nothing changes in the
ledger.

**Why this priority**: E5, E6, and criteria 3 and 4.

**Independent Test**: Settle an approved authorization and check the new ledger debit, the closed
hold, and available balance; settle an unknown ID and check that the ledger and all holds are
unchanged.

**Acceptance Scenarios**:

1. **Given** approved, active Auth-A (AED 200.00), **When** E5 settles it for AED 185.00, **Then**
   the settlement receives the verdict approved at HC-10 (proposed: accepted, criterion 3), a
   ledger debit is appended as approved at HC-17, and Auth-A's hold is closed as approved at HC-1.
2. **Given** no authorization Auth-Z, **When** E6 settles Auth-Z for AED 180.00, **Then** the
   settlement is rejected, no ledger entry is appended, the last replay sequence and every balance
   are unchanged **[Assessment, criterion 4 — verdict pending HC-10]**; remaining state pending
   HC-12, HC-14.
3. **Given** a settlement that fails any anticipated check (authorization side or Spec 1 ledger
   validation), **Then** neither the debit nor the hold closure is recorded **[Proposed — HC-11]**.
   This is failure-atomicity for anticipated errors in a single-threaded in-memory model, not
   crash-atomicity (see HC-11).
4. Settlement amount greater than the hold, settlement of a non-active authorization, and
   account/currency mismatches are pending HC-7, HC-8, HC-18.

---

### User Story 5 - Spec 2 replay coverage (Priority: P2)

Replay E1–E8 for ACC-001 in the written order and check the authorization outcomes of E3, E5, E6,
E8 together with ledger and available balances at the approved boundaries.

**Why this priority**: Proves the rules on the assessment's own stream; feeds Spec 4.

**Independent Test**: One scenario test replays the eight events and compares every outcome with the
values approved at HC-9, HC-16, and HC-19.

**Acceptance Scenarios**:

1. **Given** E1–E8 replayed in written order, **Then** E3, E5, E6, E8 have the outcomes approved at
   HC-16, HC-10, HC-9.
2. **Given** the same replay, **Then** ledger balances by value day and available balances at the
   approved boundaries match the table approved at HC-16.
3. **Given** the end of the replay, **Then** Auth-B has no settlement, and if approved at HC-9 its
   hold is still active through Day 6 **[Assessment]**.
4. **Given** the end-of-Day-5, pre-fee boundary, **Then** the Day 2 closing balance still satisfies
   criterion 1 as approved at HC-19.

---

### Edge Cases

All edge cases below are **[Proposed]** and blocked on the named checkpoint.

- Settlement smaller than the hold (E5): unused AED 15.00 released or kept (HC-1).
- Settlement larger than the hold (HC-8).
- Two authorization requests with the same ID (HC-6).
- Settlement account or currency differs from the authorization's (HC-7).
- Settlement of an authorization that was rejected or already settled (HC-18).
- Authorization request whose amount is zero, negative, non-integer, or in the wrong currency for
  the account: proposed to be rejected with the same validation rules as Spec 1 postings (HC-7).
- Available balance already negative before a request (E8 under HC-9): any positive hold is
  rejected.
- Settlement when available balance would go negative (HC-18).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** **[Assessment]**: The system MUST calculate an account's available balance as its
  ledger balance minus the sum of its active authorization holds, in the account's currency. The
  calculation takes the ledger balance and the active hold amounts as inputs **[Proposed — HC-20]**.
- **FR-002** **[Assessment]**: The system MUST approve an authorization only if the account's
  available balance after applying the requested hold is at or above zero, and MUST reject it
  otherwise.
- **FR-003** **[Assessment]**: An authorization hold MUST NOT change the ledger balance; approving or
  rejecting an authorization MUST NOT append a ledger entry.
- **FR-004** **[Assessment, criterion 4 — verdict HC-10]**: A settlement referencing an authorization
  ID that is not present MUST be rejected, and MUST NOT append a ledger entry or change any balance.
- **FR-005** **[Proposed — HC-17]**: An accepted settlement MUST append exactly one DEBIT entry to the
  ledger for the settled amount, through the Spec 1 ledger interface.
- **FR-006** **[Proposed — HC-1]**: An accepted settlement MUST close the authorization's hold so that
  it no longer reduces available balance.
- **FR-007** **[Proposed — HC-11]**: Every anticipated rejection of a settlement (authorization-side
  checks and Spec 1 ledger validation) MUST be detected before anything is recorded, so an
  anticipated failure never leaves a debit without a hold closure or a closure without a debit. This
  is failure-atomicity for anticipated errors only; crash-atomicity is not claimed (HC-11).
- **FR-008** **[Proposed — HC-2, HC-13]**: The system MUST answer, for an authorization ID, whether it
  is present and its current state, derived from the recorded history.
- **FR-009** **[Constitution II; assessment "no event record is ever mutated or deleted"]**: No
  authorization or settlement record MUST ever be mutated or deleted once recorded. How lifecycle
  changes are represented is HC-13.
- **FR-010** **[Proposed — HC-4, HC-5, HC-15]**: An authorization decision MUST obtain the ledger
  balance and the active holds at its replay boundary, and pass them to the available-balance
  calculation.
- **FR-011** **[Constitution I]**: All amounts MUST use the Spec 1 money adapter; holds and settlements
  in a currency different from the account's MUST be rejected (handling detail HC-7).
- **FR-012** **[Constitution V]**: Spec 1 source, tests, and documents MUST NOT be modified; Spec 2
  composes the Spec 1 ledger through its public interface.
- **FR-013** **[Proposed — HC-3, HC-12, HC-14]**: Rejected authorizations and rejected settlements
  MUST be observable afterwards in a way that lets Spec 4 print them as errors; whether they are
  immutable domain records or only returned results is pending.
- **FR-014** **[Proposed — HC-6, HC-7, HC-8, HC-18]**: Duplicate IDs, account/currency mismatches,
  over-authorization settlements, and settlements of non-active authorizations MUST be handled as
  approved; until approved they are unspecified and untested.

### Key Entities

- **Authorization request**: event id, authorization id, account, hold amount, event day, value day.
- **Authorization (derived)**: an authorization id with its account, hold amount, current state, and
  whether its hold is active — derived from its history (HC-13).
- **Hold**: the amount an active authorization subtracts from available balance. Not a ledger entry.
- **Settlement request**: event id, referenced authorization id, account, settled amount, event day,
  value day.
- **Settlement posting**: the ledger DEBIT created by an accepted settlement (HC-17).
- **Rejection**: the outcome of a rejected authorization or settlement, with a reason (HC-3, HC-14).
- **Replay boundary**: the point in the written event order at which a decision or balance is
  evaluated (HC-4, HC-15).

## Human Checkpoints *(blocking — resolve before writing assertions)*

Each checkpoint lists the question, the AI's **proposed** interpretation (not approved), and where a
value is involved, its full calculation. Mark decisions in
[checklists/human-checkpoints.md](checklists/human-checkpoints.md). Option analysis is in
[research.md](research.md).

Amounts: AED, 2 decimal places; minor units in brackets. Ledger balance "as known" means entries
appended so far in the written replay order (Spec 1 `balanceAsKnownAt`).

### HC-1 — Settlement smaller than its hold (E5)

**Question**: When a settlement is smaller than its hold, is the complete hold closed and the unused
amount released immediately?

**Proposed**: Yes. E5 closes Auth-A's full AED 200.00 hold at E5's replay position; the unused
AED 15.00 (200.00 − 185.00; 20000 − 18500 = 1500) stops reducing available balance immediately. No
later partial settlement of Auth-A is possible.

**Why**: The assessment describes one settlement per authorization and no partial-capture lifecycle;
keeping AED 15.00 held indefinitely would reduce available balance for the rest of the window with no
event to release it.

**Alternative**: keep AED 15.00 held until an explicit release (none exists in the stream) — changes
available balance after E5 from AED 465.00 to AED 450.00 and E8's pre-request available balance from
AED −155.00 to AED −170.00 (see HC-9).

### HC-2 — Minimum set of authorization states

**Question**: Which states are required without over-designing?

**Proposed**: Three outcomes, each derived from history:

| State | Hold active? | Reached by |
|-------|--------------|-----------|
| Approved (active) | yes | approved authorization request |
| Rejected | never | rejected authorization request (only if HC-3 retains it) |
| Settled (closed) | no | accepted settlement |

No "pending", "expired", "cancelled", "partially settled", or "reversed" state — no assessment event
reaches them. Auth-B ends Day 6 as Approved (active) if approved at HC-9, else Rejected (or absent,
per HC-3).

### HC-3 — Rejected authorization: retained or only returned?

**Question**: Is a rejected authorization retained as an immutable result, or only returned to the
caller?

**Proposed**: Retained as an immutable history record with state Rejected and a reason. Spec 4 must
print "authorization states and errors" per day; a rejected Auth-B (HC-9) must appear in that output.
It creates no hold and no ledger entry.

**Consequence to confirm**: a retained rejection makes the ID "present" for HC-6 (duplicates) and for
criterion 4's wording — see HC-18.

### HC-4 — Replay boundary for available balance

**Question**: At which replay boundary is available balance evaluated for an authorization decision?

**Proposed**: At the authorization's written replay position: ledger entries appended before it
(Spec 1 `lastSequence()` captured immediately before the decision) and holds active immediately
before it, for the authorization's value day (HC-5). Not at start or end of the event day, and not
after later events.

**Why it matters**: E7 (Day 5) precedes E8 (Day 5) in the written order. Evaluating E8 at a
start-of-Day-5 or "before E7" boundary would exclude E7 and reverse the E8 decision (HC-9).

### HC-5 — Event day and value day for holds

**Question**: How do event day and value day apply to holds, which affect available balance but not
ledger balance?

**Proposed**:

- A hold becomes active at its replay position (knowledge order), and closes at its settlement's
  replay position. Its value day is recorded but does not change which value days it affects.
- The ledger balance used for a decision is the closing balance for the authorization's value day,
  as known at the HC-4 boundary.
- A settlement's ledger debit uses the settlement's event day and value day (HC-17).

For the assessment stream, E3 (event Day 2, value Day 2) and E8 (event Day 5, value Day 5) have equal
event and value days, and no ledger entry has a value day after either authorization's value day at
its decision point, so the alternatives in research R3 give the same numbers here. The choice still
must be approved because it defines the rule.

### HC-6 — Duplicate authorization IDs

**Proposed**: A second authorization request with an ID that is already present (in any state) is
rejected; the existing authorization is unchanged, and no hold is placed. No assessment event
exercises this.

### HC-7 — Account or currency mismatch

**Proposed**:

- Authorization request: unknown account or amount currency ≠ account currency → rejected, using the
  same rules and error meanings as Spec 1 postings; non-positive or non-`bigint` amount → rejected.
- Settlement: account ≠ the authorization's account, or currency ≠ the authorization's currency →
  settlement rejected; no ledger entry; authorization unchanged and still active.

No assessment event exercises this.

### HC-8 — Settlement larger than its authorization

**Proposed**: Rejected; no ledger entry; the authorization remains active. The assessment gives no
over-capture tolerance, and accepting it would debit funds that were never checked against available
balance. No assessment event exercises this.

### HC-9 — E8 Auth-B decision at its written replay position

**Question**: Approve or reject Auth-B (AED 90.00) at E8's written position?

Event-by-event calculation for ACC-001, **assuming HC-1 (full release), HC-4 (replay position), and
HC-5 (value day of the authorization) as proposed**. "Ledger (vd ≤ 5)" is the closing balance for
value Day 5 as known after the row; for every row the all-known balance (no value-day cut) is the
same, because no entry has value day 6.

| Step | Event | Ledger effect | Ledger (vd ≤ 5) | Active holds | Available |
|------|-------|---------------|-----------------|--------------|-----------|
| 0 | start | — | 0.00 [0] | 0.00 | 0.00 |
| 1 | E1 CREDIT vd 1 | +1,200.00 | 1,200.00 [120000] | 0.00 | 1,200.00 |
| 2 | E2 DEBIT vd 1 | −950.00 | 250.00 [25000] | 0.00 | 250.00 |
| 3 | E3 Auth-A hold (HC-16) | none | 250.00 [25000] | 200.00 | 50.00 [5000] |
| 4 | E4 CREDIT vd 3 | +400.00 | 650.00 [65000] | 200.00 | 450.00 [45000] |
| 5 | E5 settle Auth-A 185.00 vd 4; hold closed (HC-1) | −185.00 | 465.00 [46500] | 0.00 | 465.00 [46500] |
| 6 | E6 settle Auth-Z — rejected | none | 465.00 [46500] | 0.00 | 465.00 [46500] |
| 7 | E7 DEBIT vd 2 | −620.00 | −155.00 [−15500] | 0.00 | −155.00 [−15500] |
| 8 | E8 Auth-B request 90.00 | none | −155.00 [−15500] | 0.00 | test: −155.00 − 90.00 = **−245.00 [−24500]** |

Check: 120000 − 95000 + 40000 − 18500 − 62000 = −15500; −15500 − 9000 = −24500 < 0.

**Proposed conclusion — PENDING HUMAN APPROVAL**: **Rejected**. Post-hold available balance
AED −245.00 is below zero.

Sensitivity (all pending):

| Variant | Available before E8 | After 90.00 | Decision |
|---------|---------------------|-------------|----------|
| As proposed | −155.00 | −245.00 | Reject |
| HC-1 alternative: AED 15.00 of Auth-A still held | −170.00 | −260.00 | Reject |
| HC-4 alternative: boundary before E7 (start of Day 5) | 465.00 | 375.00 | Approve |
| Overdraft fees already booked (Spec 3, not modelled here) | below −155.00 | below −245.00 | Reject |

Only a boundary that excludes E7 would approve Auth-B. Because E7 precedes E8 in the written order,
the proposal is rejection.

### HC-10 — Verdicts for acceptance criteria 3, 4, 5

All three verdicts are **proposed and pending human approval**.

- **Criterion 3 — "The Day 4 settlement of Auth-A must be accepted."** Proposed: **correct —
  accept**. At E5, Auth-A is present (E3), approved (HC-16), active, on ACC-001, in AED, and
  185.00 ≤ 200.00. Available balance before E5 is 650.00 − 200.00 = 450.00; after the debit and hold
  release it is 650.00 − 185.00 = 465.00 ≥ 0, so no available-balance rule is broken even if one
  applied to settlements (HC-18).
- **Criterion 4 — "Any settlement referencing an authorization ID not present in the ledger must be
  rejected and the funds must not leave the account."** Proposed: **correct — accept**, reading
  "present in the ledger" as "present in the authorization history" (authorizations are not ledger
  entries). E6: Auth-Z has no preceding authorization, so the settlement is rejected; ledger balance
  stays AED 465.00 [46500] at every value day ≥ 4, and no sequence is consumed. Wording caveat for
  REJECTED/AMBIGUITIES: a settlement for an ID that is present but rejected or already settled is
  also rejected (HC-18), which is stricter than the criterion, not contrary to it.
- **Criterion 5 — "If Auth-B is approved, its hold reduces available balance but not ledger
  balance."** Proposed: **correct as a conditional rule — accept**. The rule it states is the
  assessment's own definition (available = ledger − holds). Under HC-9 Auth-B is rejected, so the
  condition is not met in the stream and Auth-B places no hold; the rule is verified instead with an
  approved hold (Auth-A between E3 and E5: ledger 250.00 unchanged, available 50.00), and with a
  separate unit case. If the human approves Auth-B at HC-9 instead, criterion 5 applies directly:
  Auth-B's AED 90.00 stays held through Day 6 and ledger balance is unaffected.

### HC-11 — Settlement consistency (failure-atomic, not crash-atomic)

**Question**: How is an accepted settlement posted while its hold is closed, so that partial state
cannot occur?

**Proposed guarantee — deliberately limited**: *failure-atomic for anticipated errors* in a
single-threaded, in-memory model. It is **not** crash-atomic and not transactional.

**Proposed order of operations**:

1. Run every authorization-side check (present, active, account, currency, amount ≤ hold, days)
   before any write. An anticipated rejection here records nothing.
2. Build and freeze the closing record in full, so no construction step remains after the ledger
   write.
3. Append the ledger debit through Spec 1 `append`. Spec 1 validates first and, on failure, stores
   nothing and consumes no sequence (Spec 1 contract), so an anticipated ledger rejection also
   records nothing on either side.
4. Only after `append` returns, push the prepared closing record onto the authorization history.

**What this does and does not guarantee**:

- Every anticipated failure (validation, unknown or non-active authorization, mismatch,
  over-settlement, Spec 1 ledger rejection) happens before the first write, so it leaves no partial
  state.
- Step 4 has no anticipated failure, but it is not proven unable to fail: an unanticipated error
  (runtime fault, out of memory, a defect in the component) or a process crash between steps 3 and 4
  would leave a ledger debit with its hold still active. This is a known limitation of composing two
  in-memory stores without a transaction, and of not changing Spec 1.
- The order is chosen so that this residual failure is the conservative one: the hold stays active,
  so available balance is understated, never overstated; and the debit is detectable (a settlement
  ledger entry with no closing record).
- Single-threaded execution means no other operation can observe the state between steps 3 and 4.

**Alternatives** (research R7): a shared transaction or a single-store design would give stronger
atomicity but require changing Spec 1's ledger, which is out of scope. The limitation should be
recorded by the human (e.g. in `AMBIGUITIES.md`, and as a candidate production risk for the final
architecture notes in Spec 4).

### HC-12 — State after a rejected settlement (E6)

**Proposed**: After E6:

- Ledger: unchanged — same entries, same `lastSequence()`, ACC-001 balance AED 465.00 [46500] for
  value days 4–6 as known after E6 (250.00 + 400.00 − 185.00).
- Authorizations: unchanged — Auth-A still Settled; Auth-Z still not present (no authorization is
  created from a settlement).
- A rejection record for E6 with reason "unknown authorization" exists only if HC-14 is approved.

### HC-13 — Immutable transitions vs mutable state

**Question**: Are lifecycle changes new immutable transition records with current state derived from
history, or is mutable in-memory state allowed?

**Proposed**: Immutable, append-only transition records; current state is derived from them.

**Reconciliation with the constitution**: Principle II ("Ledger entries are immutable … corrections
are new, compensating entries") literally governs ledger entries. The assessment's rule is broader:
"No event record is ever mutated or deleted." An authorization that changes from Approved to Settled
by overwriting a field would mutate the record of E3. Recording E5's effect as a new transition
("Auth-A settled by E5") keeps E3's record intact, matches the ledger's own style, and makes
"state as known at a boundary" answerable. A mutable lookup map would be allowed only as a derived,
private cache rebuilt from the records — not as the source of truth. This does not need a
constitution amendment; if the human prefers mutable state, the plan's Complexity Tracking must
justify it.

### HC-14 — Rejected incoming events in the domain-event history

**Question**: Are rejected authorizations and settlements part of the immutable domain-event
history, even though they create no ledger posting?

**Proposed**: Yes. Every incoming authorization and settlement event produces exactly one immutable
outcome record (accepted or rejected, with reason). Rejections never create ledger entries and never
consume a ledger sequence. This gives Spec 4 its "errors" per day without re-running decisions.

### HC-15 — Replay sequence ordering across postings and authorization records

**Proposed**: Keep the Spec 1 ledger sequence unchanged (it counts ledger entries only — Spec 1
contract, HC-4). Authorization records carry their own strictly increasing sequence, assigned by the
authorization component, and each record also stores the ledger `lastSequence()` observed when it
was recorded. Cross-store order is then total: a record comes after every ledger entry up to its
stored ledger boundary, and before later ones. A single shared counter would require changing
Spec 1's ledger, which is out of scope. Alternatives in research R6.

### HC-16 — E3 decision and E3/E5/E6 values

**Proposed — PENDING**: E3 approved. Calculation: ledger balance for value Day 2 as known after E2 =
1,200.00 − 950.00 = 250.00 [25000]; active holds 0.00; post-hold 250.00 − 200.00 = 50.00 [5000] ≥ 0.

Proposed Spec 2 replay table, ACC-001 closing ledger balance by value day (HC-1, HC-17 as
proposed):

| Value day | As known after E6 (before E7) | As known after E8 (E1–E8) | Calculation (after E8) |
|-----------|-------------------------------|---------------------------|------------------------|
| Day 1 | 250.00 | 250.00 | 1,200.00 − 950.00 |
| Day 2 | 250.00 | −370.00 | 250.00 − 620.00 (E7) |
| Day 3 | 650.00 | 30.00 | −370.00 + 400.00 (E4) |
| Day 4 | 465.00 | −155.00 | 30.00 − 185.00 (E5) |
| Day 5 | 465.00 | −155.00 | no Day 5 ledger entry |
| Day 6 | 465.00 | −155.00 | no Day 6 ledger entry in Spec 2 |

Available balance after E8 (proposed): −155.00, equal to ledger, because Auth-A is closed and Auth-B
is rejected (HC-9). These are pre-fee, pre-E9 values; Spec 3 will change them.

### HC-17 — Settlement ledger posting

**Proposed**: E5 appends one DEBIT to ACC-001: event id `E5`, amount AED 185.00 [18500], event day 4,
value day 4 (the settlement's own days, not the authorization's). The hold is not posted to the
ledger at any time.

### HC-18 — Settlement preconditions beyond existence

**Proposed**:

- Settlement of an authorization that is present but Rejected or already Settled → rejected, no
  ledger entry.
- No available-balance check at settlement for an amount within the active hold: those funds were
  already reserved when the authorization was approved. (Moot for E5: available stays ≥ 0 either
  way — HC-10.)

### HC-19 — Criterion 1 re-check with Spec 2 postings

**Proposed — PENDING**: Criterion 1 remains accepted. The only ledger entry Spec 2 adds to ACC-001 is
E5's debit with value day 4 (HC-17); holds create no ledger entries. Day 2 closing balance as known
at the end-of-Day-5, pre-fee boundary = E1 + E2 + E7 = 1,200.00 − 950.00 − 620.00 = −370.00 [−37000];
E4 (value day 3) and E5 (value day 4) are excluded by value day. Fees remain for Spec 3 to re-check.

### HC-20 — Shape of `availableBalance()` (gates cycle 1 only)

**Question**: Should `availableBalance()` look up balances and holds itself, or calculate from
inputs it is given?

**Proposed**: A pure calculation. Inputs: one ledger balance (`Money`) and the amounts of the active
holds (`Money` values, possibly none). Output: ledger balance − Σ holds, in the same currency;
currency mismatch rejected by the money adapter. No ledger or history access, no boundary
parameter, no side effects.

**Why**: It lets cycle 1 test the complete rule — including one and several active holds — without
any authorization existing, so the function is finished in cycle 1 and never changes afterwards.
Choosing the ledger boundary and value day (HC-4, HC-5), and deciding which holds are active
(HC-1, HC-13, HC-15), belong to `authorize()`, the lookup, and the replay, which call this
calculation. Those checkpoints therefore no longer gate cycle 1.

**Alternative**: an account-level query (account, value day, boundary) that reads the ledger and the
authorization history. It cannot be tested with holds until `authorize()` exists, which would leave
cycle 1 incomplete — the reason this alternative is not proposed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every Spec 2 test and the full suite pass, and `npm run typecheck` reports no errors.
- **SC-002**: Every expected value in a Spec 2 test is traceable to an approved checkpoint in
  [checklists/human-checkpoints.md](checklists/human-checkpoints.md).
- **SC-003**: The E6 test shows zero ledger entries added and every ACC-001 balance unchanged.
- **SC-004**: No authorization or settlement operation changes a Spec 1 ledger entry, and Spec 1
  source, tests, and documents are byte-for-byte unchanged by Spec 2.
- **SC-005**: Criteria 3, 4, and 5 each have a recorded verdict with reasoning, and any rejection is
  recorded in `REJECTED.md` by the human.

## Assumptions

- Days are integers 1–6; both accounts open at zero (Spec 1).
- Authorization and settlement amounts are given as integer minor units through the money adapter.
- An authorization and its settlement each carry the assessment event id (`E3`, `E5`, …) in
  addition to the authorization id (`Auth-A`, …).
- Only ACC-001 is exercised by authorization events.
- One settlement per authorization; no partial or multiple captures (HC-1, HC-2).
- The Spec 1 ledger is used only through its public interface.
