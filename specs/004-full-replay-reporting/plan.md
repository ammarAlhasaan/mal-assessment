# Implementation Plan: Full Replay, Reporting, and Delivery

**Branch**: `004-full-replay-reporting` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

## Summary

Add a thin replay layer over the unchanged Spec 1–3 modules: typed E1–E10 data, a replay that applies
the Spec 3 cutoffs and returns per-close snapshots, a report-model builder, a pure text renderer, and
`src/run.ts` as the non-interactive entry point. No new financial calculation.

## Technical Context

- TypeScript (strict), Node.js ≥ 24.12 type stripping, ES modules; `node:test`; no new dependency.
- Constraints: Dinero.js only in `src/money/`; append-only; Spec 1–3 behaviour unchanged.

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Exact Money | Report keeps `Money`; renderer uses `format()` only | ✅ |
| II. Append-Only | Replay only appends through existing functions | ✅ |
| III. Temporal | Written order preserved; as-known balances via `balanceAsKnownAt` | ✅ |
| IV. Human-Owned | Every value/output line pending HC approval; human commits tests and code | ✅ |
| V. Focused Scope | No new financial behaviour; one `package.json` script change (HC-10) | ✅ |

## Project Structure (proposed)

```text
src/replay/types.ts       # ReplayEvent, CloseSnapshot, ReplayResult, DayReport
src/replay/events.ts      # ASSESSMENT_ACCOUNTS, ASSESSMENT_EVENTS
src/replay/replay.ts      # replay(accounts, events)
src/report/types.ts       # AccountBalance, DayReport, FinalBalances, Report
src/report/report.ts      # buildReport(accounts, result)
src/report/render.ts      # renderReport(report)
src/run.ts                # entry point (replaces placeholder, HC-9)
test/replay/events.test.ts
test/replay/replay.test.ts
test/report/report.test.ts
test/report/render.test.ts
test/replay/full-replay.test.ts                      # full scenario (HC-13)
test/limitations/duplicate-reversal.limitation.ts    # intentional failure (HC-10)
```

## Proposed Signatures (confirmed per cycle)

```ts
export function replay(accounts: readonly Account[], events: readonly ReplayEvent[]): ReplayResult;
export function buildReport(accounts: readonly Account[], result: ReplayResult): Report;
export function renderReport(report: Report): string;
```

## Cycle Order

| # | Unit | Assessment source | Checkpoints | Test values |
|---|------|-------------------|-------------|-------------|
| 1 | `ASSESSMENT_EVENTS` data | "Event stream, replayed in this order" | HC-8 | Assessment E1–E10 |
| 2 | `replay()` | "replays the event stream"; Spec 3 HC-17; E6 | HC-2, HC-3, HC-5, HC-7 | Synthetic mini-streams |
| 3 | `buildReport()` | "per day: closing ledger balance…" | HC-1, HC-4 | Synthetic |
| 4 | `renderReport()` | "prints" | HC-6 | Synthetic model → exact text |
| 5 | `src/run.ts` wiring | "runnable … script" | HC-9 | None (routine wiring; covered by cycle 6) |
| 6 | Full scenario | Whole stream; criteria | HC-11, HC-13 | Research R2/R3 |
| 7 | Intentional failure | "One failing test against your own design" | HC-10 | Research R5 |
| 8 | Delivery docs + verification | Deliverable 1 | HC-12 | — |

Each cycle: decisions → `test: define …` + `feat: implement …` (human commits) → AI runs focused/full
tests + typecheck, reviews, commits docs only (`docs: record …`).

## Complexity Tracking

None.
