# Implementation Plan: Authorizations and Settlements

**Branch**: `002-authorizations-settlements` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-authorizations-settlements/spec.md`

## Summary

Add an in-memory authorization component that sits beside the Spec 1 ledger and uses it only through
its public `Ledger` interface. It answers available balance (ledger balance minus active holds),
decides authorization requests with the assessment's approval rule, derives authorization state from
an append-only history, and settles authorizations by appending one ledger debit and closing the
hold, failure-atomically for anticipated errors (not crash-atomic — HC-11). Assessment coverage: E3, E5, E6, E8 and criteria 3, 4, 5, replayed after the Spec 1
events E1, E2, E4, E7. Every financial value and every lifecycle rule not stated by the assessment is
a human checkpoint (HC-1…HC-20). Checkpoints are decided just in time: only the checkpoints that
gate the next function cycle are decided before that cycle starts (see *Checkpoint Gates per Cycle*).

This plan proposes a design; items marked *pending HC-n* change if the human decides differently.

## Technical Context

**Language/Version**: TypeScript (strict, `typescript@^7`), run directly by Node.js ≥ 24.12 via type
stripping; ES modules.

**Primary Dependencies**: none new. Uses `src/money/` (Dinero.js adapter) and `src/ledger/` from
Spec 1.

**Storage**: N/A — in-memory only.

**Testing**: `node:test` + `node:assert/strict` via `npm test`; `npm run typecheck`.

**Target Platform**: Node.js on the developer's machine.

**Project Type**: Library core exercised by tests.

**Performance Goals**: N/A — at most a handful of authorizations.

**Constraints**: integer minor units only; no Dinero.js import outside `src/money/`; no mutation or
deletion of any recorded event; Spec 1 files unchanged.

**Scale/Scope**: 1 account exercised (ACC-001), 4 assessment events (E3, E5, E6, E8), 3 criteria.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Exact Money | Holds, settlements, and available balance use `Money` and the adapter's `add`/`subtract`/`compare`; no floats; no Dinero.js outside `src/money/` | ✅ Pass (by design) |
| II. Append-Only Ledger | Settlement debits go through Spec 1 `append`; holds never create ledger entries; authorization lifecycle recorded as new immutable records, never edits (*pending HC-13*); every anticipated settlement rejection detected before the first write — failure-atomic, not crash-atomic (*pending HC-11*) | ✅ Pass if HC-13 approved as proposed; otherwise re-check |
| III. Temporal Correctness | Authorization records keep event day and value day independently; decisions use ledger balance as known at the authorization's replay position (*pending HC-4, HC-5, HC-15*) | ✅ Pass (by design) |
| IV. Human-Owned Logic | No values in tests or contracts before approval; AI adds only minimum types and a throwing signature per function cycle; human writes assertions and bodies; review without editing | ✅ Pass |
| V. Focused Scope | No fees, reversals, interest, reporting, or ACC-002 work; no new dependency; Spec 1 unchanged | ✅ Pass |

**Post-design re-check**: ✅ Pass — [data-model.md](data-model.md) and
[contracts/authorizations.md](contracts/authorizations.md) add no dependency, no mutation path, and no
change to `src/ledger/` or `src/money/`. HC-13 is the only gate whose outcome could require a
Complexity Tracking entry (if mutable state is chosen).

## Project Structure

### Documentation (this feature)

```text
specs/002-authorizations-settlements/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── authorizations.md
├── checklists/
│   ├── requirements.md
│   └── human-checkpoints.md
└── tasks.md
```

### Source Code (repository root) — implemented

```text
src/
├── money/                          # Spec 1 — unchanged
├── ledger/                         # Spec 1 — unchanged
└── authorizations/
    ├── types.ts                    # added one cycle at a time, minimum types only
    └── authorizations.ts           # component bound to one Ledger

test/
└── authorizations/
    ├── authorizations.test.ts          # unit cycles 1–4
    └── authorization-events.test.ts    # cycle 5: E1–E8 replay, E3/E5/E6/E8
```

**Structure Decision**: One new module with a one-way dependency
`authorizations → ledger → money → dinero.js`. The authorization component is created over an
existing `Ledger` and never reaches into its internals. Tests mirror the source folder. No file is
created by this planning step.

## Proposed Function Order

One function per TDD cycle. Closely related cases (including error cases) of one function share one
focused cycle; an error case never gets its own production function.

| # | Function | Responsibility | Assessment source | Checkpoints decided just before this cycle |
|---|----------|----------------|-------------------|----------------------|
| 1 | `availableBalance()` | Pure calculation: given ledger balance − Σ given active hold amounts | Rule "available balance — ledger balance minus active holds"; criterion 5 rule | HC-20 |
| 2 | `authorize()` | Select the ledger balance and active holds at the request's boundary, apply the approval rule via `availableBalance()`, record the outcome; no ledger entry | Rule "approved only if … at or above zero"; criterion 5 rule (hold reduces available, not ledger) | HC-2, HC-3, HC-4, HC-5, HC-6, HC-7 (authorization part), HC-13, HC-14, HC-15 |
| 3 | Authorization lookup and derived current state | Whether an ID is present; its account, hold, state, and hold activity, derived from history (optionally at a boundary) | E6 note "Auth-Z has no preceding authorization"; criterion 4 "not present"; Spec 4 needs states | No new checkpoint; human confirms the name and shape derived from the cycle 2 decisions |
| 4 | `settle()` | Accept → one ledger debit + hold closed (failure-atomic for anticipated errors); reject → nothing changes (unknown ID, and other approved rejection reasons) | E5; E6; criteria 3, 4 | HC-1, HC-7 (settlement part), HC-8, HC-11, HC-12, HC-17, HC-18 |
| 5 | Spec 2 replay coverage | E1–E8 in written order; outcomes of E3, E5, E6, E8; balances | E3, E5, E6, E8; "Auth-B is never settled inside the window"; criteria 1 (re-check), 3, 4, 5 | HC-9, HC-10, HC-16, HC-19 |

Notes:

- **Cycle 1 is complete on its own** (HC-20, research R11): `availableBalance()` is a pure
  calculation over a ledger balance and the active hold amounts it is given, so cycle 1 tests it
  with no hold, one hold, several holds, a negative result, and a currency mismatch — without any
  authorization existing. No later cycle changes its behaviour; later cycles only decide *which*
  inputs to pass it.
- **Assessment outcomes are asserted once, in cycle 5**: cycles 2 and 4 use synthetic values the
  human approves in that cycle. The E3/E8 decisions (HC-16, HC-9) and criteria verdicts (HC-10) are
  therefore decided just before cycle 5, not earlier.
- **Cycle 3 name and shape**: deliberately left open. Whether lookup returns "not present" as a
  distinct result, whether it accepts a boundary, and how a rejected authorization appears all
  depend on HC-2, HC-3, HC-13, HC-14. The signature is chosen at the start of cycle 3, after those
  are approved.
- **Cycle 2 before cycle 3**: `authorize()` needs a duplicate-ID check (HC-6), which needs an
  internal "is this ID present" query. The public lookup operation is specified in cycle 3; cycle 2
  may use only what it needs internally.
- **Cycle 4** covers E6 (unknown authorization) in the same focused cycle as E5; no separate
  rejection function.

## Checkpoint Gates per Cycle

Decisions are made in small steps, immediately before the cycle that needs them — never all up
front:

1. Decide HC-20 → run cycle 1 (`availableBalance()`) to green and reviewed.
2. Decide HC-2, HC-3, HC-4, HC-5, HC-6, HC-7 (authorization part), HC-13, HC-14, HC-15 → run cycle 2
   (`authorize()`).
3. Confirm the lookup name and shape (no new checkpoint) → run cycle 3.
4. Decide HC-1, HC-7 (settlement part), HC-8, HC-11, HC-12, HC-17, HC-18 → run cycle 4 (`settle()`).
5. Approve HC-9, HC-10, HC-16, HC-19 → run cycle 5 (replay coverage).

A later cycle's checkpoints may be discussed early, but are not approved or encoded until their
cycle is next.

## Per-Function Workflow (applies to every cycle)

1. Select one function only.
2. AI explains the exact assessment source for the function and every related test.
3. AI adds only the minimum types and an unimplemented signature (`throw new Error("Not
   implemented")`).
4. The human approves and writes every assertion.
5. Run the focused test; the human confirms the intended red failure.
6. The human commits tests, minimum types, and signature separately (`test: define <behavior>`).
7. AI does not provide or apply implementation until explicitly requested.
8. The human owns and applies the function body, unless explicitly delegating an accepted review fix.
9. Run the focused test, relevant module tests, full tests, and typecheck.
10. AI reviews the implementation without editing it.
11. The human applies accepted findings, unless explicitly delegating an accepted review fix under
    Constitution v1.1.0 (recorded in `tasks.md` and `WORKLOG.md` as AI-authored).
12. The human commits the implementation separately (`feat: implement <behavior>`).
13. Move to the next function only after the current one is green and reviewed.

Commit pattern: `test: define <behavior>`, `feat: implement <behavior>`, `docs: record <decision>`,
`fix: <specific accepted review finding>`.

## Ownership Map

| Item | Owner |
|------|-------|
| Spec Kit artifacts, minimum types, throwing signatures, test file structure and names, running commands, review | AI |
| HC-1…HC-20 decisions and values, every assertion, every function body, red-run confirmation, choice of accepted findings, `AMBIGUITIES.md` / `REJECTED.md` / `WORKLOG.md` entries, commits | Human |

## Complexity Tracking

No constitution violations to justify. If HC-13 is decided in favour of mutable authorization state
as the source of truth, add an entry here explaining why it does not conflict with the assessment's
"no event record is ever mutated or deleted".
