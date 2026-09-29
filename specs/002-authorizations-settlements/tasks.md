---
description: "Task list for authorizations and settlements"
---

# Tasks: Authorizations and Settlements

**Input**: Design documents from `/specs/002-authorizations-settlements/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: Required. The human approves and writes every assertion. AI may add only the minimum types
and a throwing signature at the start of a cycle.

## Format: `[ID] [P?] [Story] [Owner] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 available balance, US2 approval, US3 lookup/state, US4 settlement, US5 replay
- **[Owner]**: `AI` or `HUMAN`
- `[x]` = done; everything else is open

Commit pattern: `test: define <behavior>` · `feat: implement <behavior>` ·
`docs: record <decision>` · `fix: <specific accepted review finding>`.

**Small-step rule**: there is no up-front checkpoint phase. Each cycle begins with the decisions it
needs — and only those — then runs to green and reviewed before the next cycle's decisions are
taken. A later cycle's checkpoints may be discussed early but are not approved or encoded until that
cycle is next.

---

## Phase 1: Setup

- [x] T001 [AI] Create branch `002-authorizations-settlements` from `main` at `fc4ec7f`
- [x] T002 [AI] Create `specs/002-authorizations-settlements/` artifacts (spec, plan, research, data model, contract, quickstart, checklists, tasks)

No dependency, source file, or test file is created in setup. Types and signatures are added per
function cycle (plan → *Per-Function Workflow*).

---

## Phase 2: Cycle 1 — `availableBalance()` (US1, P1) 🎯

**Assessment source**: rule "available balance — ledger balance minus active holds"; criterion 5
rule (a hold reduces available balance, not ledger balance).
**Focused test**: `node --test --test-name-pattern="available balance" "test/authorizations/**/*.test.ts"`

Decisions for this cycle:

- [x] T003 [HUMAN] Decide HC-20 — `availableBalance()` as a pure calculation over a given ledger balance and given active hold amounts (CHK001)

Cycle:

- [x] T004 [US1] [AI] Explain the assessment source for `availableBalance()` and each planned test case
- [x] T005 [US1] [AI] Add minimum types and throwing `availableBalance()` signature in `src/authorizations/types.ts` / `src/authorizations/authorizations.ts`; update `contracts/authorizations.md` to match
- [x] T006 [US1] [HUMAN] Approve and write assertions in `test/authorizations/authorizations.test.ts` with synthetic values: no hold, one hold, several holds, negative result, currency mismatch, inputs unchanged
- [x] T007 [US1] [HUMAN] Run the focused test and confirm the intended red failure
- [x] T008 [US1] [HUMAN] Commit tests, types, and signature (`test: define available balance`)
- [x] T009 [US1] [HUMAN] Implement `availableBalance()`
- [x] T010 [US1] [AI] Run focused, module, full tests and typecheck; review without editing
- [x] T011 [US1] [HUMAN] Apply accepted findings (or delegate explicitly); commit (`feat: implement available balance`) — *body landed in `3281725`, committed as `test: define available balance`; no separate feat commit*

**Gate**: cycle 1 green and reviewed; `availableBalance()` is complete and is not changed by later cycles.

---

## Phase 3: Cycle 2 — `authorize()` (US2, P1)

**Assessment source**: approval rule "at or above zero after the hold is applied"; criterion 5 rule
(authorization appends no ledger entry). **Depends on**: cycle 1 green.
**Focused test**: `node --test --test-name-pattern="authoriz" "test/authorizations/authorizations.test.ts"`

Decisions for this cycle:

- [ ] T012 [HUMAN] Decide HC-4, HC-5, HC-15 — decision boundary, value-day rule, record ordering (CHK002–CHK004)
- [ ] T013 [HUMAN] Decide HC-2, HC-3, HC-13, HC-14 — states, rejection retention, immutable history (CHK005–CHK008)
- [ ] T014 [HUMAN] Decide HC-6 and the authorization part of HC-7 — duplicate IDs, account/currency/amount validation (CHK009–CHK010)
- [ ] T015 [HUMAN] Record the decisions above in `AMBIGUITIES.md` (`docs: record authorization decisions`)

Cycle:

- [ ] T016 [US2] [AI] Explain the assessment source for `authorize()` and each planned case (approve, reject, exactly zero, no ledger entry, hold reduces available but not ledger, approved invalid-input cases)
- [ ] T017 [US2] [AI] Add minimum types and throwing `authorize()` signature; update the contract
- [ ] T018 [US2] [HUMAN] Approve and write assertions (synthetic values) in `test/authorizations/authorizations.test.ts`
- [ ] T019 [US2] [HUMAN] Confirm red; commit (`test: define authorization approval`)
- [ ] T020 [US2] [HUMAN] Implement `authorize()`
- [ ] T021 [US2] [AI] Run focused, module, full tests and typecheck; review without editing
- [ ] T022 [US2] [HUMAN] Apply accepted findings; commit (`feat: implement authorization approval`)

---

## Phase 4: Cycle 3 — Authorization lookup and derived current state (US3, P2)

**Assessment source**: E6 note "Auth-Z has no preceding authorization"; criterion 4 "not present";
per-day authorization states required by the assessment output (Spec 4). **Depends on**: cycle 2
green. No new checkpoint: the shape follows from the cycle 2 decisions.
**Focused test**: `node --test --test-name-pattern="lookup" "test/authorizations/authorizations.test.ts"`

Decision for this cycle:

- [ ] T023 [HUMAN] Confirm the lookup name and shape AI proposes from the approved HC-2/HC-3/HC-13/HC-14/HC-15 (CHK011)

Cycle:

- [ ] T024 [US3] [AI] Explain the assessment source and each planned case
- [ ] T025 [US3] [AI] Add minimum types and the throwing lookup signature the human confirmed; update the contract
- [ ] T026 [US3] [HUMAN] Approve and write assertions (present/approved, not present, rejected per HC-3, state as known at a boundary per HC-15)
- [ ] T027 [US3] [HUMAN] Confirm red; commit (`test: define authorization lookup`)
- [ ] T028 [US3] [HUMAN] Implement lookup and state derivation
- [ ] T029 [US3] [AI] Run focused, module, full tests and typecheck; review without editing
- [ ] T030 [US3] [HUMAN] Apply accepted findings; commit (`feat: implement authorization lookup`)

---

## Phase 5: Cycle 4 — `settle()` including unknown-authorization rejection (US4, P1)

**Assessment source**: E5; E6; criteria 3 and 4; append-only rule. E5 and E6 are one focused cycle —
no separate rejection function. **Depends on**: cycle 3 green.
**Focused test**: `node --test --test-name-pattern="settle" "test/authorizations/authorizations.test.ts"`

Decisions for this cycle:

- [ ] T031 [HUMAN] Decide HC-1 and HC-17 — hold release on a smaller settlement; the settlement debit's fields (CHK012–CHK013)
- [ ] T032 [HUMAN] Decide the settlement part of HC-7, and HC-8, HC-18 — mismatches, over-settlement, non-active authorization (CHK014–CHK016)
- [ ] T033 [HUMAN] Decide HC-11 and HC-12 — failure-atomic (not crash-atomic) ordering and its recorded limitation; state after a rejected settlement (CHK017–CHK018)
- [ ] T034 [HUMAN] Record the decisions above in `AMBIGUITIES.md` (`docs: record settlement decisions`)

Cycle:

- [ ] T035 [US4] [AI] Explain the assessment source and each planned case (accepted settlement debit, hold closed, anticipated rejections leave no partial state, unknown id rejected with ledger unchanged, approved HC-7/HC-8/HC-18 rejections)
- [ ] T036 [US4] [AI] Add minimum types and throwing `settle()` signature; update the contract
- [ ] T037 [US4] [HUMAN] Approve and write assertions (synthetic values)
- [ ] T038 [US4] [HUMAN] Confirm red; commit (`test: define settlement`)
- [ ] T039 [US4] [HUMAN] Implement `settle()`
- [ ] T040 [US4] [AI] Run focused, module, full tests and typecheck; review without editing (verify every anticipated rejection happens before the first write)
- [ ] T041 [US4] [HUMAN] Apply accepted findings; commit (`feat: implement settlement`)

---

## Phase 6: Cycle 5 — Spec 2 replay coverage (US5, P2)

**Assessment source**: E1–E8 in written order; E3, E5, E6, E8; "Auth-B is never settled inside the
window"; criteria 3, 4, 5; criterion 1 re-check. **Depends on**: cycle 4 green.
**Focused test**: `node --test test/authorizations/authorization-events.test.ts`

Decisions for this cycle:

- [ ] T042 [HUMAN] Approve HC-16 — E3 decision and the Spec 2 replay table, with calculations (CHK019–CHK020)
- [ ] T043 [HUMAN] Approve HC-9 — E8 Auth-B decision and Auth-B's state through Day 6 (CHK021–CHK022)
- [ ] T044 [HUMAN] Approve HC-10 — criteria 3, 4, 5 verdicts — and HC-19 — criterion 1 re-check (CHK023–CHK026)
- [ ] T045 [HUMAN] Record verdicts in `REJECTED.md` / `AMBIGUITIES.md` (`docs: record authorization criteria`)

Cycle:

- [ ] T046 [US5] [AI] Explain the assessment source for the scenario and each checked value, citing its approved checkpoint
- [ ] T047 [US5] [AI] Create the scenario test file structure and test name only (no assertions, no values)
- [ ] T048 [US5] [HUMAN] Write the replay and assertions in `test/authorizations/authorization-events.test.ts` using only approved HC-9/HC-10/HC-16/HC-19 values; capture boundaries with `lastSequence()`
- [ ] T049 [US5] [HUMAN] Run and confirm the result (red if any behaviour is missing; otherwise record that it passed on first run and why); commit (`test: cover authorization and settlement events`)
- [ ] T050 [US5] [HUMAN] Fix any behaviour the scenario exposes, in the owning function
- [ ] T051 [US5] [AI] Run full tests and typecheck; review without editing

---

## Phase 7: Review and completion

- [ ] T052 [AI] Final review against the contract and constitution: no Dinero.js outside `src/money/`, no record mutation, no ledger entry from a hold or rejection, Spec 1 files unchanged (`git diff --stat main -- src/ledger src/money test/ledger test/money specs/001-ledger-foundation`)
- [ ] T053 [HUMAN] Apply accepted findings (or delegate explicitly; delegated fixes recorded here and in `WORKLOG.md` as AI-authored)
- [ ] T054 [AI] Run `npm test` and `npm run typecheck`; report results
- [ ] T055 [HUMAN] Sync `contracts/authorizations.md` and `spec.md` status with what was built (AI may draft)
- [ ] T056 [HUMAN] Record the real work and responsibilities for Spec 2 in `WORKLOG.md`
- [ ] T057 [HUMAN] Commit the completed specification

---

## Dependencies & Execution Order

- Setup → [cycle 1 decisions → cycle 1] → [cycle 2 decisions → cycle 2] → [cycle 3 confirmation →
  cycle 3] → [cycle 4 decisions → cycle 4] → [cycle 5 decisions → cycle 5] → review and completion.
- Only one function cycle is open at a time; the next cycle's decisions start only when the current
  cycle is green and reviewed.
- Within a cycle: decisions → explain source → minimum types/signature → human assertions →
  confirmed red → separate test commit → human implementation → tests + typecheck → review →
  accepted fixes → separate implementation commit.
- No task is marked [P]: every cycle touches the same module and depends on the previous one.

## Notes

- No expected financial value enters a test until its checkpoint is marked in
  [checklists/human-checkpoints.md](checklists/human-checkpoints.md).
- Cycles 1, 2 and 4 use synthetic values approved in that cycle; the assessment's own outcomes
  (E3, E5, E6, E8, criteria) are asserted only in cycle 5.
- Spec 1 files (`src/ledger/`, `src/money/`, `test/ledger/`, `test/money/`,
  `specs/001-ledger-foundation/`) are not edited by any task.
