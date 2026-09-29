---
description: "Task list for full replay, reporting, and delivery"
---

# Tasks: Full Replay, Reporting, and Delivery

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md)

Format: `[ID] [Story] [Owner] Description` · `[x]` = done.
Commits: `test: define …` / `feat: implement …` (human) · `docs: record …` (AI, docs only).

## Phase 1: Setup

- [x] T001 [AI] Verify clean `main` at `456eaf3`, Specs 1–3 merged, 93 tests pass, typecheck passes
- [x] T002 [AI] Create branch `004-full-replay-reporting`; create artifacts; point `.specify/feature.json` at it
- [ ] T003 [HUMAN] Approve cycle order (CHK000)

## Cycle 1 — `ASSESSMENT_EVENTS` (US1) · `node --test test/replay/events.test.ts`

- [ ] T004 [HUMAN] Decide HC-8
- [ ] T005 [AI] Present test, types, implementation
- [ ] T006 [HUMAN] Commit tests / implementation
- [ ] T007 [AI] Run checks; review; record decisions

## Cycle 2 — `replay()` (US2) · `node --test test/replay/replay.test.ts`

- [ ] T008 [HUMAN] Decide HC-2, HC-3, HC-5, HC-7
- [ ] T009 [AI] Present test, types, implementation
- [ ] T010 [HUMAN] Commit tests / implementation
- [ ] T011 [AI] Run checks; review; record decisions

## Cycle 3 — `buildDailyReport()` (US3) · `node --test test/report/report.test.ts`

- [ ] T012 [HUMAN] Decide HC-1, HC-4
- [ ] T013 [AI] Present test, types, implementation
- [ ] T014 [HUMAN] Commit tests / implementation
- [ ] T015 [AI] Run checks; review; record decisions

## Cycle 4 — `renderReport()` (US3) · `node --test test/report/render.test.ts`

- [ ] T016 [HUMAN] Decide HC-6
- [ ] T017 [AI] Present test, implementation
- [ ] T018 [HUMAN] Commit tests / implementation
- [ ] T019 [AI] Run checks; review; record decisions

## Cycle 5 — entry point (US4) · `npm start`

- [ ] T020 [HUMAN] Decide HC-9
- [ ] T021 [AI] Present `src/run.ts` and smoke-test removal
- [ ] T022 [HUMAN] Commit
- [ ] T023 [AI] Run `npm start`, tests, typecheck; record

## Cycle 6 — full scenario (US5) · `node --test test/replay/full-replay.test.ts`

- [ ] T024 [HUMAN] Approve HC-11, HC-13 and research R2/R3
- [ ] T025 [AI] Present the scenario tests
- [ ] T026 [HUMAN] Apply, run, commit
- [ ] T027 [AI] Run checks; record criteria classification

## Cycle 7 — intentional failure (US6) · `npm run test:limitation`

- [ ] T028 [HUMAN] Decide HC-10
- [ ] T029 [AI] Present limitation test and `package.json` scripts
- [ ] T030 [HUMAN] Commit
- [ ] T031 [AI] Confirm `npm test` passes and `npm run test:limitation` exits 1; record

## Cycle 8 — delivery

- [ ] T032 [HUMAN] Decide HC-12
- [ ] T033 [AI] Draft `README.md`, `NUMBERS.md`; update `AMBIGUITIES.md`, `REJECTED.md`
- [ ] T034 [HUMAN] Approve documents; record Spec 4 in `WORKLOG.md`
- [ ] T035 [AI] Verify all four documented commands; confirm history intact (no squash)
