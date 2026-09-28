---
description: "Task list for the money and ledger foundation"
---

# Tasks: Money and Ledger Foundation

**Input**: Design documents from `/specs/001-ledger-foundation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: Required. Test names are scaffolded by AI; every assertion is written by the human.

## Format: `[ID] [P?] [Story] [Owner] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 money, US2 E10 allocation, US3 append-only entries, US4 temporal balances
- **[Owner]**: `AI` or `HUMAN` — the constitution's ownership split
- `[x]` = done in the scaffolding pass; everything else is open

---

## Phase 1: Setup

- [x] T001 [AI] Install `dinero.js@2.0.2` with an exact version pin in `package.json` and `package-lock.json`
- [x] T002 [AI] Ratify `.specify/memory/constitution.md` v1.0.0
- [x] T003 [AI] Create `specs/001-ledger-foundation/` artifacts (spec, plan, research, data model, contracts, quickstart, checklists, tasks)

---

## Phase 2: Foundational scaffolding (blocks all stories)

- [x] T004 [P] [AI] Money adapter types, currency table, error class, and signatures in `src/money/money.ts`
- [x] T005 [P] [AI] Ledger types and `Ledger` interface in `src/ledger/types.ts`
- [x] T006 [AI] `createLedger` signature and ledger error classes in `src/ledger/ledger.ts`
- [x] T007 [P] [AI] Test scaffolding in `test/money/money.test.ts`
- [x] T008 [P] [AI] Test scaffolding in `test/ledger/ledger.test.ts` and `test/ledger/foundation-events.test.ts`
- [x] T009 [AI] Run `npm test` and `npm run typecheck` on the scaffolding

**Checkpoint**: Scaffolding in place; human checkpoints can begin.

---

## Phase 3: Human checkpoints (blocks the assertions that reference them)

- [ ] T010 [HUMAN] HC-1: approve E10 allocation amounts, remainder order, and the criterion 7 verdict (`spec.md`, `checklists/human-checkpoints.md`)
- [ ] T011 [HUMAN] HC-2: approve how the three E10 instalments are posted to ACC-002
- [ ] T012 [HUMAN] HC-3: approve E1/E2/E4/E7 closing balances for value days 1–6 (all entries and before E7) and the criterion 1 verdict
- [ ] T013 [HUMAN] HC-4: approve the replay-sequence boundaries ("before E7", "end of Day 5, pre-fee")

---

## Phase 4: User Story 1 — Exact money in AED and BHD (P1) 🎯 MVP

**Independent Test**: `node --test "test/money/**/*.test.ts"`

- [ ] T014 [US1] [HUMAN] Write assertions for precision, creation, formatting, arithmetic, and comparison in `test/money/money.test.ts`
- [ ] T015 [US1] [HUMAN] Confirm red run for T014
- [ ] T016 [US1] [HUMAN] Implement `decimalPlaces`, `money`, `zero`, `format`, `add`, `subtract`, `compare` in `src/money/money.ts`

---

## Phase 5: User Story 2 — Equal allocation for E10 (P1)

**Independent Test**: `node --test --test-name-pattern="equal allocation" "test/money/**/*.test.ts"`

- [ ] T017 [US2] [HUMAN] Write E10 allocation and criterion 7 assertions in `test/money/money.test.ts` (depends on T010)
- [ ] T018 [US2] [HUMAN] Confirm red run for T017
- [ ] T019 [US2] [HUMAN] Implement `allocateEqually` in `src/money/money.ts`

---

## Phase 6: User Story 3 — Append-only ledger entries (P1)

**Independent Test**: `node --test --test-name-pattern="append-only|validation" "test/ledger/ledger.test.ts"`

- [ ] T020 [US3] [HUMAN] Write append-only and validation assertions in `test/ledger/ledger.test.ts`
- [ ] T021 [US3] [HUMAN] Confirm red run for T020
- [ ] T022 [US3] [HUMAN] Implement `createLedger` with `append`, `entries`, `lastSequence` in `src/ledger/ledger.ts` (depends on T016)

---

## Phase 7: User Story 4 — Temporal balances (P2)

**Independent Test**: `node --test "test/ledger/**/*.test.ts"`

- [ ] T023 [US4] [HUMAN] Write balance-query assertions in `test/ledger/ledger.test.ts`
- [ ] T024 [US4] [HUMAN] Write E1/E2/E4/E7/E10 and criterion 1 assertions in `test/ledger/foundation-events.test.ts` (depends on T010–T013)
- [ ] T025 [US4] [HUMAN] Confirm red run for T023–T024
- [ ] T026 [US4] [HUMAN] Implement `balanceByValueDay` and `balanceAsKnownAt` in `src/ledger/ledger.ts` (depends on T022)

---

## Phase 8: Review and completion

- [ ] T027 [AI] Review human code against the contracts and constitution without modifying it; confirm Dinero.js is imported only in `src/money/`
- [ ] T028 [HUMAN] Apply accepted review findings
- [ ] T029 [AI] Run `npm test` and `npm run typecheck`; report results
- [ ] T030 [HUMAN] Record the criterion 7 rejection (from HC-1) for `REJECTED.md` and the criterion 1 verdict (from HC-3)
- [ ] T031 [HUMAN] Record the real work and responsibilities for Spec 1 in `WORKLOG.md`
- [ ] T032 [HUMAN] Commit the completed specification

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 (checkpoints) → stories.
- US1 (T014–T016) needs no checkpoint and can start once Phase 2 is done.
- US2 needs HC-1. US3 needs US1's implementation (T016). US4 needs US3 (T022) and HC-1…HC-4.
- For every story: assertions → confirmed red → implementation.
- Phase 8 after all stories.

## Notes

- Do not edit test names or signatures without updating the contracts.
- No expected financial value enters a test until its checkpoint is marked in
  `checklists/human-checkpoints.md`.
