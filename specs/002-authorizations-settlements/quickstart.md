# Quickstart: Authorizations and Settlements

## Setup

```bash
npm ci
```

No new dependency is added by this specification.

## Run the tests

All tests (Spec 1 must stay green throughout):

```bash
npm test
```

Only this specification's tests:

```bash
node --test "test/authorizations/**/*.test.ts"
```

One focused test during a cycle:

```bash
node --test --test-name-pattern="<test name>" "test/authorizations/**/*.test.ts"
```

## Typecheck

```bash
npm run typecheck
```

## Boundary checks

Dinero.js only under `src/money/`:

```bash
grep -rn "dinero.js" src test --include=*.ts
```

Expected: matches only in `src/money/money.ts`.

Spec 1 files unchanged by Spec 2 (run on the Spec 2 branch):

```bash
git diff --stat main -- src/ledger src/money test/ledger test/money specs/001-ledger-foundation
```

Expected: no output.

## Workflow for this specification

1. For each function in the order in [plan.md](plan.md) — `availableBalance()`, `authorize()`, lookup
   and derived state, `settle()`, replay coverage:
   1. Decide only that cycle's checkpoint group in
      [checklists/human-checkpoints.md](checklists/human-checkpoints.md); record decisions that change
      repository documents in `AMBIGUITIES.md` / `REJECTED.md` (`docs: record <decision>`).
   2. Follow the 13-step per-function workflow in the plan.
   3. Only when the cycle is green and reviewed, move to the next cycle's checkpoint group.
2. After cycle 5: full `npm test`, `npm run typecheck`, AI review, human-applied findings, `WORKLOG.md`
   entry, human commit.

## What the Spec 2 replay checks

The cycle 5 scenario replays E1, E2, E3, E4, E5, E6, E7, E8 for ACC-001 in the written order and
checks the human-approved outcomes and balances from HC-9, HC-10, HC-16, and HC-19. Their
event-by-event calculations are recorded in [spec.md](spec.md) → *Human Checkpoints*.
