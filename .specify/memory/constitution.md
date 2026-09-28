<!--
Sync Impact Report
- Version change: template → 1.0.0 (initial ratification)
- Principles defined: I. Exact Money, II. Append-Only Ledger, III. Temporal Correctness,
  IV. Human-Owned Financial Logic (Test-First), V. Focused Scope and Simplicity
- Sections added: Technology Constraints, Development Workflow, Governance
- Templates requiring updates: none (plan/spec/tasks templates reference the constitution generically) ✅
- Deferred items: none
-->

# Account Ledger Assessment Constitution

## Core Principles

### I. Exact Money

- Every monetary amount MUST be stored as an integer number of minor units (`bigint`). Floating-point
  numbers MUST NOT hold, compute, or round money.
- Each currency has exactly one precision: AED has 2 decimal places, BHD has 3. Amounts are stored
  and rounded to their own currency's precision.
- All money operations (creation, formatting, arithmetic, comparison, allocation) MUST go through the
  local money adapter in `src/money/`. Only that adapter may import the money library (Dinero.js).
- Operations combining two amounts MUST reject mismatched currencies instead of converting.
- Splitting an amount MUST preserve the total exactly; no minor unit may be created or lost.

**Rationale**: The assessment is judged on exact decimal behaviour. A single adapter keeps the
library replaceable and the precision rules in one reviewable place.

### II. Append-Only Ledger

- Ledger entries are immutable once appended. No entry is ever updated or deleted.
- Corrections are expressed only as new, compensating entries.
- Every appended entry receives a strictly increasing replay sequence at append time. The sequence is
  the ledger's record of knowledge order and MUST NOT be supplied by callers.
- Entries MUST be validated (known account, matching account currency, positive amount) before they
  are appended; a rejected entry leaves the ledger and its sequence counter unchanged.

**Rationale**: The assessment makes append-only storage non-negotiable, and historical balance
questions can only be answered if nothing is rewritten.

### III. Temporal Correctness

- Each entry records its event day (when the ledger learned of it) and its value day (the day it
  affects balances) as independent fields. Neither is derived from the other.
- A closing ledger balance for a day includes every entry whose value day is on or before that day.
- Balances MUST also be answerable "as known at" a replay-sequence boundary, i.e. using only entries
  appended at or before that sequence.

**Rationale**: Back-valued events (a later event with an earlier value day) change historical
balances; the assessment's criteria depend on distinguishing what was true from what was known.

### IV. Human-Owned Financial Logic (Test-First, NON-NEGOTIABLE)

- The human owns every financial calculation and expected result, every unit-test assertion, every
  money-adapter and ledger function body, confirmation of the red test run, and the choice of which
  review findings to apply.
- AI owns specification artifacts, dependency installation, types, interfaces, function signatures,
  test file structure and test names, routine wiring, command execution, and code review.
- AI scaffolding MUST NOT implement human-owned logic. Unimplemented human-owned functions throw
  `new Error("Not implemented")`; scaffolded test bodies contain only `assert.fail("Not implemented")`.
- AI MUST NOT introduce expected financial values unless they are explicitly marked as pending human
  approval.
- Order of work: human approves checkpoints → human writes assertions → human confirms red run →
  human implements → AI reviews without editing human code → human applies accepted fixes → green.

**Rationale**: The assessment evaluates the human's financial judgement; AI assistance must be
visible, bounded, and reviewable.

### V. Focused Scope and Simplicity

- In-memory TypeScript only: no web layer, persistence, database, or UI.
- Each specification implements only the assessment events and rules assigned to it; later concerns
  are left to later specifications rather than stubbed early.
- Tests validate the project's own contracts and the assessment requirements, not third-party library
  internals.
- New runtime dependencies require a documented reason and an exact version pinned in
  `package-lock.json`.

**Rationale**: A small, legible codebase is easier to review and to reason about financially.

## Technology Constraints

- Language: TypeScript executed directly by Node.js (type stripping), ES modules, strict compiler
  settings from `tsconfig.json`.
- Tests: Node's built-in runner (`node:test`) with `node:assert/strict`, executed by `npm test`.
- Type safety: `npm run typecheck` MUST pass before a specification is considered complete.
- Money library: Dinero.js with `bigint` amounts, accessed only through `src/money/`.

## Development Workflow

- Each specification lives in `specs/NNN-name/` with spec, plan, research, data model, contracts,
  quickstart, checklists, and tasks.
- Human checkpoints listed in a specification MUST be resolved and recorded before the corresponding
  assertions are written.
- A specification is complete only when: its tests and `npm run typecheck` pass, AI review has been
  performed, accepted findings are applied by the human, and `WORKLOG.md` records the real work.
- Commit history is preserved; completed specifications are committed by the human before the next
  specification starts. History is never squashed or rewritten.

## Governance

- This constitution supersedes conflicting guidance in any specification or plan. Plans MUST include a
  Constitution Check; violations MUST be justified in the plan's Complexity Tracking table or removed.
- Amendments require a written change to this file, an updated Sync Impact Report, and a semantic
  version bump (MAJOR: principle removed or redefined; MINOR: principle or section added; PATCH:
  clarification).
- Reviews MUST verify: no floating-point money, no Dinero.js import outside `src/money/`, no entry
  mutation or deletion, and ownership boundaries respected.

**Version**: 1.0.0 | **Ratified**: 2026-09-28 | **Last Amended**: 2026-09-28
