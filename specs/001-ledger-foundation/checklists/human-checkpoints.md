# Human Checkpoints Checklist: Money and Ledger Foundation

**Purpose**: Gate the human-owned financial decisions before assertions are written
**Created**: 2026-09-28
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Human only. Mark `[x]` after recording the decision and its values in
`spec.md` → *Human Checkpoints*. AI does not mark these items on its own; the marks below were
applied by AI on 2026-09-29 at the human's explicit request, based on the human-approved tests and
`AMBIGUITIES.md` / `REJECTED.md`. Items left open still need the human.

## HC-1 — E10 allocation

- [x] CHK001 The three E10 instalment amounts are recorded in BHD minor units
- [x] CHK002 Their sum is shown to equal the E10 total exactly
- [x] CHK003 The order in which remainder minor units are assigned is approved
- [x] CHK004 The verdict and reasoning for acceptance criterion 7 are recorded for `REJECTED.md`

## HC-2 — Posting E10 to ACC-002

- [x] CHK005 Number of entries, direction, and event id per entry are approved
- [x] CHK006 Event day and value day per entry are approved
- [x] CHK007 Append order of the instalments and E10's position in the replay order are approved

## HC-3 — E1/E2/E4/E7 temporal balances (ACC-001)

- [x] CHK008 Closing balance for value days 1–6 with all Spec 1 entries is recorded
- [x] CHK009 Closing balance for value days 1–6 as known before E7 is recorded
- [x] CHK010 The verdict for acceptance criterion 1 is recorded with reasoning

## HC-4 — Replay-sequence boundaries

- [x] CHK011 The "before E7" boundary is defined
- [x] CHK012 The "end of Day 5, before any fee" boundary is defined, including E10's treatment — *confirmed by the human on 2026-09-29*
- [x] CHK013 Tests obtain boundaries from `lastSequence()` rather than hard-coded numbers (confirmed)

## Workflow gates

- [x] CHK014 All scaffolded assertions replaced by the human
- [x] CHK015 Red run confirmed by the human (tests failed for the intended reason) — *confirmed on 2026-09-29*
- [x] CHK016 AI review completed; accepted findings applied (by AI, at the human's request, 2026-09-29)
- [x] CHK017 `npm test` and `npm run typecheck` pass
