# Human Checkpoints Checklist: Authorizations and Settlements

**Purpose**: Gate the human-owned financial and lifecycle decisions, one function cycle at a time
**Created**: 2026-09-29
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Human only. Mark `[x]` after recording the decision (and any values) in
`spec.md` → *Human Checkpoints*, replacing "Proposed" with "Approved" or the human's own decision. AI
does not mark these items. Every proposal in the spec is **pending human approval**; none is
approved.

**Small steps**: decide only the group for the next cycle, immediately before it starts. Do not
approve a later group early. Groups follow [tasks.md](../tasks.md).

## Before cycle 1 — `availableBalance()`

- [x] CHK001 HC-20 — `availableBalance()` is a pure calculation over a given ledger balance and given active hold amounts (so cycle 1 is complete with holds)

## Before cycle 2 — `authorize()`

- [x] CHK002 HC-4 — Replay boundary at which the decision's ledger balance and active holds are taken
- [x] CHK003 HC-5 — How event day and value day apply to holds and to the decision's ledger balance
- [ ] CHK004 HC-15 — Sequence ordering across ledger postings and authorization records — *deferred: not needed for E3/E8*
- [x] CHK005 HC-2 — Minimum authorization states (proposed: Approved-active, Rejected, Settled)
- [x] CHK006 HC-3 — Rejected authorization retained as an immutable record, or returned only
- [x] CHK007 HC-13 — Immutable transition records with derived state vs mutable state; reconciliation with the append-only constitution recorded
- [x] CHK008 HC-14 — Rejected incoming events are, or are not, part of the immutable domain-event history
- [x] CHK009 HC-6 — Duplicate authorization IDs — *not handled: no assessment event*
- [x] CHK010 HC-7 (authorization part) — Unknown account, currency mismatch, invalid amount or day on an authorization request — *not handled: no assessment event*

## Before cycle 3 — lookup and derived state

- [x] CHK011 Lookup name and shape confirmed (derived from CHK005–CHK008 and CHK004; no new financial decision)

## Before cycle 4 — `settle()`

- [ ] CHK012 HC-1 — Settlement smaller than hold: full hold closed and unused amount released immediately, or not
- [ ] CHK013 HC-17 — Settlement ledger posting: direction, amount, event id, event day, value day
- [ ] CHK014 HC-7 (settlement part) — Account or currency mismatch between settlement and authorization
- [ ] CHK015 HC-8 — Settlement larger than its authorized amount
- [ ] CHK016 HC-18 — Settlement of a present but non-active authorization; available-balance check at settlement
- [ ] CHK017 HC-11 — Failure-atomic (not crash-atomic) settlement ordering accepted, and its residual limitation recorded
- [ ] CHK018 HC-12 — State remaining after a rejected settlement, including E6

## Before cycle 5 — Spec 2 replay (each value needs its event-by-event calculation in the spec)

- [ ] CHK019 HC-16 — E3 Auth-A decision (proposed: approved; 250.00 − 200.00 = 50.00 — pending)
- [ ] CHK020 HC-16 — Spec 2 replay table: ACC-001 closing balance by value day, before and after E7, and available balance after E8 (pending)
- [ ] CHK021 HC-9 — E8 Auth-B decision at its written replay position, with the full calculation and sensitivity table reviewed (proposed: rejected; −155.00 − 90.00 = −245.00 — pending)
- [ ] CHK022 HC-9 — Auth-B's state through Day 6 (active hold if approved; rejected otherwise)
- [ ] CHK023 HC-10 — Criterion 3 verdict and reasoning (proposed: correct — accept)
- [ ] CHK024 HC-10 — Criterion 4 verdict and reasoning, including the reading of "present in the ledger" (proposed: correct — accept)
- [ ] CHK025 HC-10 — Criterion 5 verdict and reasoning, including how it is verified if Auth-B is rejected (proposed: correct as a conditional rule — accept)
- [ ] CHK026 HC-19 — Criterion 1 re-check with the E5 settlement debit (proposed: still −370.00 — pending)
- [ ] CHK027 Any rejected criterion recorded in `REJECTED.md`; resolved ambiguities recorded in `AMBIGUITIES.md` (human, `docs: record <decision>`)

## Workflow gates (per function cycle)

- [x] CHK028 Cycle 1 `availableBalance()` — assertions written by human, red confirmed, implemented, reviewed, green
- [x] CHK029 Cycle 2 `authorize()` — assertions, red, implemented, reviewed, green
- [x] CHK030 Cycle 3 lookup / derived state — assertions, red, implemented, reviewed, green
- [ ] CHK031 Cycle 4 `settle()` (E5 and E6 in one cycle) — assertions, red, implemented, reviewed, green
- [ ] CHK032 Cycle 5 replay coverage — assertions, red, implemented, reviewed, green
- [ ] CHK033 `npm test` and `npm run typecheck` pass; Spec 1 files unchanged; `WORKLOG.md` updated
