# Quickstart: Money and Ledger Foundation

## Setup

```bash
npm ci
```

Installs the pinned `dinero.js@2.0.2` from `package-lock.json`.

## Run the tests

All tests:

```bash
npm test
```

Only this specification's tests:

```bash
node --test "test/money/**/*.test.ts" "test/ledger/**/*.test.ts"
```

Until the human writes assertions and implementations, every Spec 1 test fails with
`Not implemented` — this is the expected scaffolding state, not the red run. The red run is confirmed
after the human has written real assertions.

## Typecheck

```bash
npm run typecheck
```

## Check the adapter boundary

Dinero.js must appear only under `src/money/`:

```bash
grep -rn "dinero.js" src test --include=*.ts
```

Expected: matches only in `src/money/money.ts`.

## Workflow for this specification

1. Human resolves HC-1…HC-4 in `spec.md` / `checklists/human-checkpoints.md`.
2. Human replaces each `assert.fail("Not implemented")` with real assertions.
3. Human runs the tests and confirms they fail for the right reason (red).
4. Human implements the function bodies in `src/money/money.ts` and `src/ledger/ledger.ts`.
5. AI reviews without editing human code; human applies accepted findings.
6. `npm test` and `npm run typecheck` pass; `WORKLOG.md` updated.
