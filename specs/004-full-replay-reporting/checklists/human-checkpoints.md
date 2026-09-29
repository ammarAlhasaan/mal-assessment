# Human Checkpoints Checklist: Full Replay, Reporting, and Delivery

**Created**: 2026-09-29 · **Feature**: [spec.md](../spec.md) · **Review ownership**: human only.

## Before any cycle

- [x] CHK000 Cycle order (plan) approved

## Before cycle 1 — event stream

- [x] CHK008 HC-8 — E10 as one event: total BHD 10.000, `instalments: 3`; last after E9; split in replay by `allocateEqually` into 3.334, 3.333, 3.333

## Before cycle 2 — `replay()`

- [x] CHK002 HC-2 — Fees, states, errors belong to the close that produced them
- [x] CHK003 HC-3 — E10 processed after E9, in the Day 6 close; snapshots keep whole events so the renderer can mark it late
- [x] CHK005 HC-5 — Errors = settlements returned `REJECTED` (E6 only); replay continues; no exception catching (error text: CHK006)
- [x] CHK007 HC-7 — Authorization state = `lookup()` per authorization id in first-appearance order at each close; Auth-Z never listed

## Before cycle 3 — `buildReport()`

- [x] CHK001 HC-1 — As known at each close + final value-dated table
- [x] CHK004 HC-4 — Day 6 includes capitalization; prints only the two `INT-` entries; accruals documented, not printed

## Before cycle 4 — `renderReport()`

- [x] CHK006 HC-6 — Exact output text (research R3); error line `… REJECTED: no active authorization`; late label `(late: event day N)`; no trailing newline

## Before cycle 5 — entry point

- [x] CHK009 HC-9 — Replace `src/run.ts`; delete `test/smoke.test.ts`; one commit; no cycle 5 test (stdout and exit code verified in cycle 6)

## Before cycle 6 — full scenario

- [ ] CHK011 HC-11 — Criteria: accept 1, 3, 4, 5; reject 2, 6, 7, 8
- [ ] CHK013 HC-13 — Structured result + exact stdout; research R2 values

## Before cycle 7 — intentional failure

- [ ] CHK010 HC-10 — Duplicate-reversal limitation; `npm test` glob; `test:limitation` script

## Before cycle 8 — delivery

- [ ] CHK012 HC-12 — `NUMBERS.md` constants (research R6)
