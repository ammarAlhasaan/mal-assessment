# Human Checkpoints Checklist: Money and Ledger Foundation

**Purpose**: Gate the human-owned financial decisions before assertions are written
**Created**: 2026-09-28
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Human only. Mark `[x]` after recording the decision and its values in
`spec.md` → *Human Checkpoints*. AI does not mark these items.

## HC-1 — E10 allocation

- [ ] CHK001 The three E10 instalment amounts are recorded in BHD minor units
- [ ] CHK002 Their sum is shown to equal the E10 total exactly
- [ ] CHK003 The order in which remainder minor units are assigned is approved
- [ ] CHK004 The verdict and reasoning for acceptance criterion 7 are recorded for `REJECTED.md`

## HC-2 — Posting E10 to ACC-002

- [ ] CHK005 Number of entries, direction, and event id per entry are approved
- [ ] CHK006 Event day and value day per entry are approved
- [ ] CHK007 Append order of the instalments and E10's position in the replay order are approved

## HC-3 — E1/E2/E4/E7 temporal balances (ACC-001)

- [ ] CHK008 Closing balance for value days 1–6 with all Spec 1 entries is recorded
- [ ] CHK009 Closing balance for value days 1–6 as known before E7 is recorded
- [ ] CHK010 The verdict for acceptance criterion 1 is recorded with reasoning

## HC-4 — Replay-sequence boundaries

- [ ] CHK011 The "before E7" boundary is defined
- [ ] CHK012 The "end of Day 5, before any fee" boundary is defined, including E10's treatment
- [ ] CHK013 Tests obtain boundaries from `lastSequence()` rather than hard-coded numbers (confirmed)

## Workflow gates

- [ ] CHK014 All scaffolded assertions replaced by the human
- [ ] CHK015 Red run confirmed by the human (tests fail for the intended reason)
- [ ] CHK016 AI review completed; accepted findings applied by the human
- [ ] CHK017 `npm test` and `npm run typecheck` pass
