# Feature Specification: Full Replay, Reporting, and Delivery

**Feature Branch**: `004-full-replay-reporting`
**Created**: 2026-09-29
**Status**: Draft — all checkpoints pending human approval
**Input**: "Spec 4 — Full Replay, Reporting, and Delivery: E1–E10 as the fixed input stream in the
written order, one runnable non-interactive replay, per-day output for Days 1–6 (closing ledger
balance, fee assessments, authorization states, errors) for ACC-001 and ACC-002, full-scenario tests,
classification of all eight criteria, one separately runnable intentionally failing test, and the
delivery documents."

## How to read this specification

- **[Assessment]** — stated in `.temp/ASSESSMENT.md`.
- **[Constitution]** — required by `.specify/memory/constitution.md`.
- **[Spec n HC-m]** — a decision already approved in an earlier specification.
- **[HC-n]** — a Spec 4 human checkpoint below. Nothing marked *proposed* is approved.
- Money is written as `AED 1,200.00 [120000]`: display value, then integer minor units.

No value or output text may enter a test until its checkpoint is ticked in
[checklists/human-checkpoints.md](checklists/human-checkpoints.md).

## Scope

In scope:

- E1–E10 as one fixed, typed event stream in the written order **[Assessment]**.
- One replay that applies the Spec 3 processing cutoffs **[Spec 3 HC-17]** and reuses the Spec 1–3
  modules without duplicating financial logic **[Constitution V]**.
- A structured per-day report model and a deterministic text renderer, kept separate.
- A non-interactive entry point (`npm start`) that prints Days 1–6 for ACC-001 and ACC-002.
- Full-scenario tests for the replay result and the rendered output.
- One intentionally failing test, run only by its own command.
- `README.md`, `NUMBERS.md`, `AMBIGUITIES.md`, `REJECTED.md`, `WORKLOG.md`.

Out of scope: Part 2 architecture, web/UI/database/persistence, refactoring Spec 1–3 code without a
genuine integration issue, new financial behaviour, production hardening, changing any approved
financial value.

## Requirement Trace

| ID | Assessment text | Covered by |
|----|-----------------|------------|
| R1 | "Event stream, replayed in this order" E1…E10 | FR-001, FR-002 |
| R2 | "exercised by a runnable test suite or script that replays the event stream" | FR-003, FR-009 |
| R3 | "prints, per day: closing ledger balance, fee assessments, authorization states, and errors" | FR-004…FR-008 |
| R4 | "The window is six days, Day 1 through Day 6" | FR-004 |
| R5 | Accounts ACC-001 (AED) and ACC-002 (BHD) | FR-004 |
| R6 | E6 "Auth-Z has no preceding authorization event"; criterion 4 | FR-007 |
| R7 | "Some of the following criteria are wrong. Identify every incorrect criterion, refuse it" | FR-010 |
| R8 | "One failing test against your own design, inline-annotated with what it reveals" | FR-011, FR-012 |
| R9 | README, NUMBERS, AMBIGUITIES, REJECTED, WORKLOG; "Intact commit history, no squashing" | FR-013 |
| R10 | Delivery checklist: "Confirm `npm start`, the default tests, and typecheck behave as documented" | FR-014 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Fixed event stream (P1)

E1–E10 exist once, as typed data, in the written order, with their own event day and value day.

1. **Then** the stream lists E1…E10 in that order; E10 is last although its event day is 5 **[Assessment]**.
2. **Then** each event keeps the assessment's account, amount, event day, and value day **[Assessment]**.

### User Story 2 — Replay (P1)

The replay processes the stream in order, runs the daily close at each day rollover and the final
window close after the last event, and returns a structured result.

1. **Given** events with a higher event day, **Then** the previous day's close runs first **[Spec 3 HC-17]**.
2. **Given** a late event (lower event day than an earlier event), **Then** no closed day is reopened **[Spec 3 HC-17]**.
3. **Given** a rejected settlement, **Then** it is recorded as an error for that close and replay continues **[Assessment: E6; HC-5]**.
4. **Then** the final close assesses fees for Days 1–6, then capitalizes interest per account **[Spec 3 HC-9, HC-10, HC-17]**.

### User Story 3 — Report model and renderer (P1)

1. **Then** there is one section per Day 1–6, each with both accounts' closing ledger balances, fees
   assessed, authorization states, and errors **[Assessment; HC-1, HC-2]**.
2. **Then** rendering the same model twice yields identical text **[HC-6]**.

### User Story 4 — Runnable replay (P1)

1. **When** `npm start` runs, **Then** it prints the report without input and exits 0 **[Assessment; HC-9]**.

### User Story 5 — Full scenario (P2)

1. **Then** the replay result matches the approved tables in [research.md](research.md) and the
   printed text matches the approved output exactly **[HC-13]**.

### User Story 6 — Intentional failure (P2)

1. **When** its own command runs, **Then** the one annotated test fails for the documented reason;
   `npm test` still passes **[Assessment; HC-10]**.

## Requirements *(mandatory)*

- **FR-001** [Assessment]: E1–E10 are defined once in `src/replay/events.ts` in written order.
- **FR-002** [Assessment; Constitution II–III]: Replay order is the array order; `eventDay` and
  `valueDay` are data and never reorder events; the ledger `sequence` stays the knowledge order.
- **FR-003** [Spec 3 HC-17]: Daily close for day *N* (fees, `assessOverdraftFees` for both accounts)
  runs immediately before the first event with a higher event day; the final window close runs after
  the last event (fees Days 1–6, then `capitalizeInterest` per account).
- **FR-004** [Assessment; HC-1]: The report has one section per Day 1–6 with both accounts.
- **FR-005** [Assessment; HC-1]: Each section's closing ledger balance is the closing balance for
  that value day as known at that day's close (after that close's fees).
- **FR-006** [Assessment; HC-2]: Fees are listed under the close that assessed them, with their value day.
- **FR-007** [Assessment; HC-5]: E6's rejected settlement is listed as an error; replay does not stop.
- **FR-008** [Assessment; HC-7]: Authorization states are the latest recorded state of each
  authorization known at that close.
- **FR-009** [Assessment; HC-9]: `npm start` runs the replay non-interactively and exits 0.
- **FR-010** [Assessment; HC-11]: All eight criteria are classified consistently with Spec 1–3.
- **FR-011** [Assessment; HC-10]: One annotated failing test exposes a real, documented limitation.
- **FR-012** [HC-10]: `npm test` excludes it and passes; a separate command runs it and fails.
- **FR-013** [Assessment; HC-12]: The five delivery documents are complete.
- **FR-014** [Assessment]: `npm start`, `npm test`, the failing-test command, and
  `npm run typecheck` behave exactly as documented in `README.md`.

## Existing modules reused (no change proposed)

| Need | Module | Function |
|------|--------|----------|
| Money, E10 split, formatting | `src/money/money.ts` | `money`, `allocateEqually`, `format` |
| Postings, balances, boundaries | `src/ledger/ledger.ts` | `createLedger`, `append`, `appendAll`, `balanceByValueDay`, `balanceAsKnownAt`, `lastSequence` |
| E3, E5, E6, E8 | `src/authorizations/authorizations.ts` | `createAuthorizations`, `authorize`, `settle`, `lookup` |
| Fees | `src/fees/fees.ts` | `assessOverdraftFees` |
| E9 | `src/reversals/reversals.ts` | `reverse` |
| Interest | `src/interest/interest.ts` | `dailyInterestAccruals`, `capitalizeInterest` |

**Integration notes** (no completed behaviour changes; see HC-7, HC-9):

- `lookup()` returns only the latest record (Spec 2 HC-15 deferred), so the replay snapshots
  authorization states at each close rather than querying history afterwards.
- `settle()` returns a `REJECTED` record without a reason and does not store it (Spec 2 HC-14), so
  the replay keeps it as the error.
- `src/run.ts` is the Spec 1 placeholder (`sayHello`) used by `test/smoke.test.ts`; `npm start`
  already points at it (HC-9).
- `npm test` is `node --test`, which discovers every `.ts` file under `test/` (verified in a scratch
  directory), so an intentionally failing file there would fail `npm test` (HC-10).

## Human Checkpoints *(blocking)*

All checkpoints are approved. Their options, recommendations, and supporting values are in [research.md](research.md).

| HC | Question | Recommendation |
|----|----------|----------------|
| HC-1 | Is each printed day an as-known-at-close view or the final value-dated view? | **Approved (2026-09-29, cycle 3)**: as known at that day's close, plus one final value-dated table after Day 6 |
| HC-2 | Which printed day do fees, authorization states, and errors belong to? | **Approved (2026-09-29, cycle 2)**: the close at which they became known (processing day); fees also show value day |
| HC-3 | Where does E10 appear? | **Approved (2026-09-29, cycle 2)**: processed after E9 in the Day 6 close, marked late (event day 5); final table shows it on value day 5 |
| HC-4 | Does Day 6's closing balance include capitalization? | **Approved (2026-09-29)**: yes (390.93 / 10.008); Day 6 prints only the two capitalization entries; daily accruals are documented in README/calculation tables, not printed |
| HC-5 | What counts as an error, and its text? | **Approved (2026-09-29, cycle 2)**: a settlement returned `REJECTED` (only E6); replay continues and catches no exceptions; Auth-B's rejection is an authorization state. Text decided with HC-6 |
| HC-6 | Exact output format | **Approved (2026-09-29, cycle 4)**: research R3; error line `<eventId> settlement <authId> <account> <amount> REJECTED: no active authorization` (HC-5 text); `Interest capitalized` only when present; no trailing newline |
| HC-7 | Authorization state line | **Approved (2026-09-29, cycle 2)**: latest record (`lookup`) per authorization id, first-appearance order, captured at each close; Auth-Z never listed |
| HC-8 | Event stream shape (E10) | **Approved (2026-09-29)**: one input event, BHD 10.000, `instalments: 3`, last after E9 in the written stream; split in replay by `allocateEqually` into BHD 3.334, 3.333, 3.333 |
| HC-9 | Entry point | **Approved (2026-09-29, cycle 5)**: replace placeholder `src/run.ts` with the replay wiring; delete `test/smoke.test.ts`; `npm start` |
| HC-10 | Intentional failing test | **Approved (2026-09-29, cycle 7)**: duplicate reversal of E7 is accepted (`test/limitations/duplicate-reversal.limitation.ts`); `npm test` = `node --test "test/**/*.test.ts"`; `npm run test:limitation` exits 1 |
| HC-11 | Criteria classification | **Approved (2026-09-29, cycle 6)**: accept 1, 3, 4, 5; reject 2, 6, 7, 8 (unchanged); each asserted in `test/replay/full-replay.test.ts` |
| HC-12 | `NUMBERS.md` constants | **Approved (2026-09-29, cycle 8)**: research R6; every implementation constant is traced to the assessment or an approved earlier decision, with its representation and why a smaller/halved value is not valid |
| HC-13 | Full-scenario test scope | **Approved (2026-09-29, cycle 6)**: structured result (research R2) + exact `node src/run.ts` stdout (R3) and exit 0 |

## Known limitations (documented, not tested)

- **Zero interest at the final close** (cycle 2): `replay()` calls `capitalizeInterest()` for every
  account. An account with no positive closing balance on Days 1–6 would produce a zero total, which
  the ledger rejects (Spec 3 HC-10), so replay would throw. Both assessment accounts earn interest
  (AED 0.93, BHD 0.008); not handled to avoid new behaviour. To be listed in `AMBIGUITIES.md` (cycle 8).

## Success Criteria *(mandatory)*

- **SC-001**: `npm start` prints the approved text and exits 0.
- **SC-002**: `npm test` passes and excludes the failing test; `npm run typecheck` passes.
- **SC-003**: The failing-test command exits non-zero with only the annotated test failing.
- **SC-004**: Every printed value traces to an approved research row; no Spec 1–3 value changes.
- **SC-005**: No Spec 1–3 source file changes except the approved `src/run.ts` replacement.
