# Implementation Plan: Fees, Reversals, and Interest

**Branch**: `003-fees-reversals-interest` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

## Summary

Add three small stateless modules beside the Spec 1 ledger — fees, reversals, interest — that use
only the public `Ledger` interface, plus one additive rate function in the money adapter. Fees and
reversals append new entries; nothing is edited. Interest is computed from value-dated closing
balances at the end of Day 6 and capitalized as one credit. Every value is pending HC-15.

## Technical Context

- **Language**: TypeScript (strict), Node.js ≥ 24.12 type stripping, ES modules.
- **Dependencies**: none new. Uses `src/money/`, `src/ledger/`.
- **Testing**: `node:test` + `node:assert/strict`; `npm test`; `npm run typecheck`.
- **Constraints**: integer minor units; Dinero.js only in `src/money/`; append-only; Spec 1/2
  behaviour unchanged.
- **Scope**: ACC-001 (E7, fees, E9, interest), ACC-002 (interest only); criteria 1, 2, 6, 8.

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Exact Money | Rate and rounding via one new adapter function (HC-12) | ✅ Pass if HC-12 approved |
| II. Append-Only | Fees, reversal, capitalization are appended; reversal target validated before append (HC-7) | ✅ Pass |
| III. Temporal | Fees keep value day (charged day) and event day (assessment day) separately; criterion 1 boundary unchanged | ✅ Pass |
| IV. Human-Owned | No value in tests before approval; AI proposes signature/tests, human applies and commits | ✅ Pass |
| V. Focused Scope | No printing, no replay orchestration beyond the Spec 3 event test | ✅ Pass |

**Spec 1 touch**: additive `applyRate` in `src/money/money.ts` (+ tests in a new describe block of
`test/money/money.test.ts`). Justified by Constitution I. No other Spec 1 or Spec 2 change.

## Project Structure

```text
src/money/money.ts                 # + applyRate (additive, HC-12)
src/fees/fees.ts                   # assessOverdraftFees
src/reversals/reversals.ts         # reverse
src/reversals/types.ts             # ReversalRequest
src/interest/interest.ts           # dailyInterestAccruals, capitalizeInterest
test/fees/fees.test.ts
test/reversals/reversals.test.ts
test/interest/interest.test.ts
test/fees/fee-reversal-interest-events.test.ts   # Spec 3 event test (HC-16)
```

## Proposed Signatures (pending approval, per cycle)

```ts
// src/money/money.ts
export function applyRate(amount: Money, rate: { amount: bigint; scale: number }): Money;

// src/fees/fees.ts
export function assessOverdraftFees(ledger: Ledger, accountId: string, assessmentDay: Day): readonly LedgerEntry[];

// src/reversals/reversals.ts
export interface ReversalRequest { eventId: string; targetEventId: string; eventDay: Day; valueDay: Day; }
export function reverse(ledger: Ledger, request: ReversalRequest): LedgerEntry;

// src/interest/interest.ts
export function dailyInterestAccruals(ledger: Ledger, accountId: string): readonly Money[]; // Days 1–6
export function capitalizeInterest(ledger: Ledger, accountId: string): LedgerEntry;
```

## Cycle Order

| # | Function | Checkpoints | Test sources |
|---|----------|-------------|--------------|
| 1 | `assessOverdraftFees` | HC-1, HC-2, HC-3, HC-4, HC-17 | Assessment fee rule |
| 2 | `reverse` | HC-5, HC-6, HC-7 | E9, append-only, Constitution II |
| 3 | `applyRate` | HC-11, HC-12 | Interest rule, precision |
| 4 | `dailyInterestAccruals` | HC-9, HC-10 | Interest rule |
| 5 | `capitalizeInterest` | HC-10, HC-17 | Capitalization rule, criterion 8 |
| 6 | Spec 3 event test | HC-8, HC-14, HC-15, HC-16 | E1–E10, criteria 1, 2, 6, 8 |

Each cycle: decisions → test commit (`test: define …`) → implementation commit (`feat: implement …`)
by the human → AI runs focused/full tests + typecheck, reviews, updates tasks/decision docs, commits
docs only (`docs: record …`).

## Complexity Tracking

None.
