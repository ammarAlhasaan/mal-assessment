# Human Checkpoints Checklist: Full Replay, Reporting, and Delivery

**Created**: 2026-09-29 · **Feature**: [spec.md](../spec.md) · **Review ownership**: human only.

## Before any cycle

- [x] CHK000 Cycle order (plan) approved

## Before cycle 1 — event stream

- [x] CHK008 HC-8 — E10 as one event: total BHD 10.000, `instalments: 3`; last after E9; split in replay by `allocateEqually` into 3.334, 3.333, 3.333

## Before cycle 2 — `replay()`

- [ ] CHK002 HC-2 — Fees, states, errors belong to the close that produced them
- [ ] CHK003 HC-3 — E10 processed after E9, reported in Day 6 as late
- [ ] CHK005 HC-5 — Errors = E6 only; error text
- [ ] CHK007 HC-7 — Authorization state = latest record per known id at the close

## Before cycle 3 — `buildDailyReport()`

- [ ] CHK001 HC-1 — As known at each close + final value-dated table
- [x] CHK004 HC-4 — Day 6 includes capitalization; prints only the two `INT-` entries; accruals documented, not printed

## Before cycle 4 — `renderReport()`

- [ ] CHK006 HC-6 — Exact output text (research R3)

## Before cycle 5 — entry point

- [ ] CHK009 HC-9 — Replace `src/run.ts`; delete `test/smoke.test.ts`

## Before cycle 6 — full scenario

- [ ] CHK011 HC-11 — Criteria: accept 1, 3, 4, 5; reject 2, 6, 7, 8
- [ ] CHK013 HC-13 — Structured result + exact stdout; research R2 values

## Before cycle 7 — intentional failure

- [ ] CHK010 HC-10 — Duplicate-reversal limitation; `npm test` glob; `test:limitation` script

## Before cycle 8 — delivery

- [ ] CHK012 HC-12 — `NUMBERS.md` constants (research R6)
