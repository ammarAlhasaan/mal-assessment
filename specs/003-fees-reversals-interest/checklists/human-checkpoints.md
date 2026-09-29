# Human Checkpoints Checklist: Fees, Reversals, and Interest

**Created**: 2026-09-29 · **Feature**: [spec.md](../spec.md) · **Review ownership**: human only.

Decide only the group for the next cycle, immediately before it starts.

## Before cycle 1 — `assessOverdraftFees()`

- [ ] CHK001 HC-1 — Fees assessed at end of day N for every value day 1…N (Option A)
- [ ] CHK002 HC-2 — Ascending scan; earlier fees count in later days' balances
- [ ] CHK003 HC-3 — Stateless; fee event id `FEE-<account>-D<day>` for idempotency
- [ ] CHK004 HC-4 — AED accounts only; BHD fee not handled (never arises)
- [ ] CHK017 HC-17 — Daily close at day rollover (fees); late arrivals do not reopen a day; final window close after the last written event (fees, then interest and capitalization)

## Before cycle 2 — `reverse()`

- [ ] CHK005 HC-5 — Fees retained after E9; no automatic refund
- [ ] CHK006 HC-6 — Opposite direction, target account/amount, reversal's own id/event day/value day; no Spec 1 type change
- [ ] CHK007 HC-7 — Unknown target rejected before append; other target cases are limitations

## Before cycle 3 — `applyRate()`

- [ ] CHK008 HC-11 — Round half up per accrual at account precision
- [ ] CHK009 HC-12 — Additive rate function in `src/money/`

## Before cycle 4 — `dailyInterestAccruals()`

- [ ] CHK010 HC-9 — Final value-dated balances at capitalization (Option A)
- [ ] CHK011 HC-10 — Days 1–6 accrue; capitalization credit earns nothing

## Before cycle 5 — `capitalizeInterest()`

- [ ] CHK012 HC-10 — One CREDIT `INT-<account>`, event day 6, value day 6, at the final window close (HC-17)

## Before cycle 6 — Spec 3 event test

- [ ] CHK013 HC-8 — E8 not re-evaluated after E9
- [ ] CHK014 HC-14 — Criterion 1 accepted; criteria 2, 6, 8 rejected
- [ ] CHK015 HC-15 — Fee, balance, and interest tables in research R1
- [ ] CHK016 HC-16 — Event test scope (E1–E10, no printing)
