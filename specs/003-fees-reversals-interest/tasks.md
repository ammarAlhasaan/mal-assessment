---
description: "Task list for fees, reversals, and interest"
---

# Tasks: Fees, Reversals, and Interest

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md)

**Tests**: Required. Every assertion uses only approved values; each test is labelled
`[Assessment]`, `[Constitution]`, or `[Approved decision: HC-n]`.

Format: `[ID] [Story] [Owner] Description` · `[x]` = done.
Commits: `test: define <behavior>` and `feat: implement <behavior>` (human) · `docs: record <decision>` (AI, docs only).

## Phase 1: Setup

- [x] T001 [AI] Create branch `003-fees-reversals-interest` from `main` at `b573312`
- [x] T002 [AI] Create `specs/003-fees-reversals-interest/` artifacts; point `.specify/feature.json` at it
- [x] T003 [HUMAN] Approve cycle order — *HC-15 tables are approved at T029, before cycle 6*

## Phase 2: Cycle 1 — `assessOverdraftFees()` (US1)

**Focused test**: `node --test test/fees/fees.test.ts`

- [x] T004 [HUMAN] Decide HC-1, HC-2, HC-3, HC-4, HC-17 (CHK001–CHK004, CHK017)
- [x] T005 [US1] [AI] Present tests, signature, and implementation in one message
- [x] T006 [US1] [HUMAN] Apply and commit tests (`test: define overdraft fee assessment`) — *`3cb6cfe`*
- [x] T007 [US1] [HUMAN] Apply and commit implementation (`feat: implement overdraft fee assessment`) — *`30dd6c1`; 5 focused, 79 total tests pass; typecheck passes*
- [x] T008 [US1] [AI] Run focused, full tests and typecheck; review; record HC-1–HC-4 and HC-17 in `AMBIGUITIES.md` (`docs: record overdraft fee decisions`)

## Phase 3: Cycle 2 — `reverse()` (US2)

**Focused test**: `node --test test/reversals/reversals.test.ts`

- [x] T009 [HUMAN] Decide HC-5, HC-6, HC-7 (CHK005–CHK007)
- [x] T010 [US2] [AI] Present tests, signature, and implementation in one message
- [x] T011 [US2] [HUMAN] Apply and commit tests (`test: define reversal`) — *`ac7743d`*
- [x] T012 [US2] [HUMAN] Apply and commit implementation (`feat: implement reversal`) — *`9e4a2c7`; 4 focused, 83 total tests pass; typecheck passes*
- [x] T013 [US2] [AI] Run tests and typecheck; review; record decisions (`docs: record reversal decisions`)

## Phase 4: Cycle 3 — `applyRate()` in `src/money/` (US3)

**Focused test**: `node --test --test-name-pattern="rate" test/money/money.test.ts`

- [ ] T014 [HUMAN] Decide HC-11, HC-12 (CHK008–CHK009)
- [ ] T015 [US3] [AI] Present tests, signature, and implementation in one message
- [ ] T016 [US3] [HUMAN] Apply and commit tests (`test: define rate application`)
- [ ] T017 [US3] [HUMAN] Apply and commit implementation (`feat: implement rate application`)
- [ ] T018 [US3] [AI] Run tests and typecheck; confirm existing money tests unchanged; record decisions

## Phase 5: Cycle 4 — `dailyInterestAccruals()` (US3)

**Focused test**: `node --test --test-name-pattern="accrual" test/interest/interest.test.ts`

- [ ] T019 [HUMAN] Decide HC-9, HC-10 (CHK010–CHK011)
- [ ] T020 [US3] [AI] Present tests, signature, and implementation in one message
- [ ] T021 [US3] [HUMAN] Apply and commit tests (`test: define daily interest accruals`)
- [ ] T022 [US3] [HUMAN] Apply and commit implementation (`feat: implement daily interest accruals`)
- [ ] T023 [US3] [AI] Run tests and typecheck; review; record decisions

## Phase 6: Cycle 5 — `capitalizeInterest()` (US4)

**Focused test**: `node --test --test-name-pattern="capitaliz" test/interest/interest.test.ts`

- [ ] T024 [HUMAN] Confirm HC-10 capitalization entry at the HC-17 final close (CHK012)
- [ ] T025 [US4] [AI] Present tests, signature, and implementation in one message
- [ ] T026 [US4] [HUMAN] Apply and commit tests (`test: define interest capitalization`)
- [ ] T027 [US4] [HUMAN] Apply and commit implementation (`feat: implement interest capitalization`)
- [ ] T028 [US4] [AI] Run tests and typecheck; review; record decisions

## Phase 7: Cycle 6 — Spec 3 event test (US5)

**Focused test**: `node --test test/fees/fee-reversal-interest-events.test.ts`

- [ ] T029 [HUMAN] Approve HC-8, HC-14, HC-15, HC-16 (CHK013–CHK016)
- [ ] T030 [US5] [AI] Present the scenario test
- [ ] T031 [US5] [HUMAN] Apply, run, commit (`test: cover fee, reversal, and interest events`)
- [ ] T032 [US5] [AI] Run full tests and typecheck; record criteria 2, 6, 8 in `REJECTED.md`, criterion 1 re-check and decisions in `AMBIGUITIES.md`

## Phase 8: Completion

- [ ] T033 [AI] Final review: no Dinero.js outside `src/money/`, no entry mutation, Spec 1/2 behaviour unchanged (`git diff --stat main -- src/ledger src/authorizations test/ledger test/authorizations`)
- [ ] T034 [HUMAN] Apply accepted findings (or delegate explicitly)
- [ ] T035 [AI] Run `npm test` and `npm run typecheck`; report
- [ ] T036 [HUMAN] Record Spec 3 in `WORKLOG.md`; merge

## Notes

- One function per cycle; the next cycle's decisions are taken only after the current cycle is green.
- Unit cycles use synthetic values; assessment values are asserted only in cycle 6.
- `src/money/money.ts` receives one additive function (HC-12); no other Spec 1 or Spec 2 file changes.
