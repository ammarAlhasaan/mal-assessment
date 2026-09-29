# Account Ledger Assessment

An in-memory account ledger core in TypeScript. It replays the assessment's event stream E1–E10 for
ACC-001 (AED) and ACC-002 (BHD) over Days 1–6 and prints, per day, the closing ledger balance, fee
assessments, authorization states, and errors. There is no web layer, persistence, database, or UI.

## Requirements

- Node.js 24.12 or later (TypeScript runs directly through Node's type stripping)
- `npm ci` installs the only runtime dependency, `dinero.js@2.0.2`, pinned in `package-lock.json`

## Commands

| Command | What it does | Expected result |
|---------|--------------|-----------------|
| `npm start` | Replays E1–E10 and prints the report | Report below; exit code 0; no input needed |
| `npm test` | Runs every `test/**/*.test.ts` file | 106 tests pass; exit code 0 |
| `npm run test:limitation` | Runs the one intentionally failing test | 1 test fails; exit code 1 |
| `npm run typecheck` | `tsc` over `src/` and `test/` | No errors |

`npm test` deliberately does not run `test/limitations/duplicate-reversal.limitation.ts`. That file
is the required failing test against our own design; its inline comment explains what it reveals
(see [The intentionally failing test](#the-intentionally-failing-test)).

## Reading the output

```text
Day 5
  Events: E7, E8
  Closing ledger balance:
    ACC-001 AED -230.00
    ACC-002 BHD 0.000
  Fees assessed:
    FEE-ACC-001-D2 ACC-001 AED 25.00 value day 2
    FEE-ACC-001-D4 ACC-001 AED 25.00 value day 4
    FEE-ACC-001-D5 ACC-001 AED 25.00 value day 5
  Authorizations:
    Auth-A ACC-001 AED 185.00 SETTLED
    Auth-B ACC-001 AED 90.00 REJECTED
  Errors: none
```

- **Each `Day N` section is the view at that day's close**, as the replay knew it at that point. The
  closing ledger balance is the balance for value day N using every entry known at that close,
  including the fees that close assessed.
- **Events** lists the events processed since the previous close, in written order. An event whose
  event day is earlier than the close it arrives in is marked `(late: event day N)`. Only E10 is late:
  it is dated Day 5 but written after the Day 6 event E9, so it appears in Day 6.
- **Fees assessed** lists fees booked at that close. A fee's own value day can be earlier than the
  close: E7 (arriving Day 5, value day 2) makes Days 2, 4, and 5 negative, so the Day 5 close charges
  all three.
- **Interest capitalized** appears only on Day 6. Day 6's closing balance includes it. The daily
  accruals behind it are not printed; they are in [Calculations](#calculations).
- **Authorizations** shows each known authorization's latest state at that close. Auth-Z never
  appears, because it never existed.
- **Errors** lists rejected events. The only one is E6, the settlement for the unknown Auth-Z. The
  replay records it and continues.
- **Final value-dated closing ledger balances** comes after Day 6. It restates every day with
  everything known at the end, so E7, E9, E10, the fees, and the interest all sit on their value
  days. Compare it with the per-day sections to see what back-valued and late events changed.

Money is printed as `<currency> <amount>` at the currency's precision (AED 2, BHD 3), with a leading
`-` for negatives and no thousands separators.

## Replay order and processing cutoffs

Events are replayed in the written order E1…E10 and never re-sorted. Each ledger entry keeps its event
day (when it became known), its value day (which closing balances it affects), and a replay sequence
assigned when it is appended.

- **Daily close (Days 1–5)** runs immediately before the first event with a higher event day. It
  assesses overdraft fees for every value day up to that day that is negative and not yet charged.
- **Late events** such as E10 do not reopen a closed day; they join the day that is still open.
- **Final window close (Day 6)** runs after the last event: fees for Days 1–6 (none are due), then
  one interest capitalization credit per account.

## Acceptance criteria

| # | Criterion | Verdict | Reason (details in `REJECTED.md` / `AMBIGUITIES.md`) |
|---|-----------|---------|------------------------------------------------------|
| 1 | Day 2 closing, at end of Day 5 before any fee, is AED −370.00 | Accepted | 1,200.00 − 950.00 − 620.00 = −370.00 |
| 2 | E7 causes exactly one fee, on Day 2 | **Rejected** | E7 makes Days 2, 4, and 5 negative: three fees |
| 3 | Auth-A's Day 4 settlement must be accepted | Accepted | Auth-A was approved and active |
| 4 | Settlement for an absent authorization is rejected; no funds leave | Accepted | E6 is an error; no ledger entry |
| 5 | Auth-B's hold, if approved, reduces available but not ledger balance | Accepted (conditional) | Auth-B is rejected; the rule is shown by Auth-A and unit tests |
| 6 | After E9 all balances and fees return to pre-E7 values | **Rejected** | E7's principal is cancelled, but the three fees remain |
| 7 | Each E10 instalment is BHD 3.334 | **Rejected** | 3 × 3.334 = 10.002; we post 3.334 + 3.333 + 3.333 = 10.000 |
| 8 | A rounding remainder in interest is discarded | **Rejected** | Capitalized total is defined as the sum of rounded accruals: no remainder |

All eight are asserted in `test/replay/full-replay.test.ts`.

## Calculations

ACC-001 closing ledger balance by value day (AED):

| Value day | Pre-E7 (Day 4 close) | End of Day 5, before fees | After Day 5 fees | Final (after E9, interest) |
|-----------|----------------------|---------------------------|------------------|----------------------------|
| 1 | 250.00 | 250.00 | 250.00 | 250.00 |
| 2 | 250.00 | −370.00 | −395.00 | 225.00 |
| 3 | 650.00 | 30.00 | 5.00 | 625.00 |
| 4 | 465.00 | −155.00 | −205.00 | 415.00 |
| 5 | 465.00 | −155.00 | −230.00 | 390.00 |
| 6 | 465.00 | −155.00 | −230.00 | 390.93 |

Daily interest at 0.04% on the final value-dated closing balance, rounded half up per day, before
capitalization (minor units):

| Day | ACC-001 balance | Exact | Rounded | ACC-002 balance | Exact | Rounded |
|-----|-----------------|-------|---------|-----------------|-------|---------|
| 1 | 250.00 | 10.0 | 10 | 0.000 | 0 | 0 |
| 2 | 225.00 | 9.0 | 9 | 0.000 | 0 | 0 |
| 3 | 625.00 | 25.0 | 25 | 0.000 | 0 | 0 |
| 4 | 415.00 | 16.6 | 17 | 0.000 | 0 | 0 |
| 5 | 390.00 | 15.6 | 16 | 10.000 | 4.0 | 4 |
| 6 | 390.00 | 15.6 | 16 | 10.000 | 4.0 | 4 |
| Total | | 91.8 | **AED 0.93** | | 8.0 | **BHD 0.008** |

E10 is allocated as BHD 3.334, 3.333, 3.333 (remainder to the first instalment). Constants and why
they have these values: `NUMBERS.md`.

## The intentionally failing test

`test/limitations/duplicate-reversal.limitation.ts` reverses E7 twice. It expects the second
reversal to be rejected, but our design accepts it: the reversal link lives only in the request and is
never stored, so after E9 the ledger cannot tell that E7 is already reversed. The second credit
creates AED 620.00 (Day 2 becomes 870.00 instead of 250.00). The fix would persist the reversed event
id on the compensating entry, which changes the Spec 1 entry types; it is documented, not built.

## Layout

```text
src/money/           exact money adapter (only place that imports Dinero.js)
src/ledger/          append-only ledger, balances by value day and by replay boundary
src/authorizations/  holds, approvals, settlements
src/fees/            overdraft-fee assessment
src/reversals/       compensating reversal entries
src/interest/        daily accruals and capitalization
src/replay/          E1–E10 stream and replay orchestration (daily and final closes)
src/report/          per-day report model and text renderer
src/run.ts           `npm start` entry point
test/                unit and scenario tests (*.test.ts)
test/limitations/    the intentionally failing test
specs/               Spec Kit specifications 001–004, with every human checkpoint
```

## Documents

- `NUMBERS.md` — every constant, and why that value and not half it
- `AMBIGUITIES.md` — every ambiguity found and how it was resolved
- `REJECTED.md` — rejected criteria and abandoned approaches
- `WORKLOG.md` — timestamped record of the work
