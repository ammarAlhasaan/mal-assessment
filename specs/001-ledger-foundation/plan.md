# Implementation Plan: Money and Ledger Foundation

**Branch**: `001-ledger-foundation` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-ledger-foundation/spec.md`

## Summary

Provide exact AED/BHD money through a small local adapter over Dinero.js (bigint), and an in-memory,
append-only ledger of credit and debit entries with independent event and value days, replay sequences
assigned at append, and two balance queries (by value day, and as known at a replay-sequence
boundary). Assessment coverage: E1, E2, E4, E7 (ACC-001) and E10 (ACC-002), plus acceptance criteria
1 and 7. AI delivers artifacts, types, signatures, and test scaffolding; the human delivers every
calculation, assertion, and function body.

## Technical Context

**Language/Version**: TypeScript (compiler `typescript@^7`, strict), run directly by Node.js ≥ 24.12
via type stripping; ES modules.

**Primary Dependencies**: `dinero.js@2.0.2` (exact pin; bigint entry point `dinero.js/bigint`). See
[research.md](research.md) R1–R3.

**Storage**: N/A — in-memory only.

**Testing**: `node:test` + `node:assert/strict` via `npm test`; `npm run typecheck` (`tsc`, no emit).

**Target Platform**: Node.js on the developer's machine.

**Project Type**: Library core exercised by tests (a runnable replay arrives in a later specification).

**Performance Goals**: N/A — at most a handful of entries per account.

**Constraints**: integer minor units only; Dinero.js confined to `src/money/`; entries immutable.

**Scale/Scope**: 2 accounts, 6 days, 5 assessment events (E10 posted as 3 entries).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Exact Money | Money is `bigint` minor units; AED 2 dp / BHD 3 dp defined once in `src/money/money.ts`; mismatched currencies rejected; allocation preserves totals | ✅ Pass |
| I. Exact Money | Dinero.js imported only in `src/money/money.ts`; ledger imports the adapter | ✅ Pass |
| II. Append-Only Ledger | `Ledger` has no update/delete; entries frozen; sequence assigned by ledger; rejected appends and rejected `appendAll` batches leave state unchanged | ✅ Pass |
| III. Temporal Correctness | `eventDay` and `valueDay` independent; `balanceByValueDay` and `balanceAsKnownAt` specified | ✅ Pass |
| IV. Human-Owned Logic | At scaffolding: bodies threw `Not implemented`, tests were `assert.fail` only, expected values left as HC-1…HC-4. Implementation and assertions remained human-owned; accepted review fixes were delegated to AI at the human's request (constitution v1.1.0) | ✅ Pass |
| V. Focused Scope | Only credit/debit; no auth, settlement, fee, reversal, interest, replay; one pinned dependency | ✅ Pass |

**Post-design re-check**: ✅ Pass — the data model and contracts introduce no additional dependency,
no mutation path, and no Dinero type in exported signatures.

## Project Structure

### Documentation (this feature)

```text
specs/001-ledger-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── money-adapter.md
│   └── ledger.md
├── checklists/
│   ├── requirements.md
│   └── human-checkpoints.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── money/
│   └── money.ts               # adapter; only importer of dinero.js
└── ledger/
    ├── types.ts               # Day, Account, PostingRequest, LedgerEntry, Ledger
    └── ledger.ts              # createLedger + ledger error classes; re-exports types

test/
├── money/
│   └── money.test.ts          # adapter contract + E10 allocation + criterion 7
└── ledger/
    ├── ledger.test.ts         # append-only, validation, balance queries
    └── foundation-events.test.ts  # E1, E2, E4, E7, E10 + criterion 1
```

Existing `src/run.ts` and `test/smoke.test.ts` are unchanged.

**Structure Decision**: Single project. Two modules (`money`, `ledger`) with a one-way dependency
`ledger → money → dinero.js`. Tests mirror the source folders.

## Ownership Map

| Item | Owner |
|------|-------|
| Spec Kit artifacts, dependency install, types/interfaces, signatures, test names, wiring, running commands, review | AI |
| HC-1…HC-4 values and decisions, all assertions, all function bodies, red-run confirmation, accepted fixes | Human |

## Complexity Tracking

No constitution violations to justify.
