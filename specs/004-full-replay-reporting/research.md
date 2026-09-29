# Research: Full Replay, Reporting, and Delivery

All values are **proposed, pending human approval**. Every financial value is reproduced from
approved Spec 1–3 tables; nothing new is calculated except where two approved values are combined
(shown). Minor units in brackets.

## R1. Replay timeline (Spec 3 HC-17 applied to the written order)

| Step | Written event / close | Event day | Value day | Ledger seq appended | Effect |
|------|-----------------------|-----------|-----------|---------------------|--------|
| 1 | E1 CREDIT ACC-001 1,200.00 | 1 | 1 | 1 | |
| 2 | E2 DEBIT ACC-001 950.00 | 1 | 1 | 2 | |
| — | **Close Day 1** (before E3) | | | — | fees: none |
| 3 | E3 AUTH Auth-A 200.00 | 2 | 2 | — | APPROVED (250.00 − 200.00 = 50.00 ≥ 0) |
| — | **Close Day 2** (before E4) | | | — | fees: none |
| 4 | E4 CREDIT ACC-001 400.00 | 3 | 3 | 3 | |
| — | **Close Day 3** (before E5) | | | — | fees: none |
| 5 | E5 SETTLE Auth-A 185.00 | 4 | 4 | 4 | SETTLED; hold closed, 15.00 released |
| 6 | E6 SETTLE Auth-Z 180.00 | 4 | 4 | — | REJECTED → error; no posting |
| — | **Close Day 4** (before E7) | | | — | fees: none |
| 7 | E7 DEBIT ACC-001 620.00 | 5 | 2 | 5 | back-valued |
| 8 | E8 AUTH Auth-B 90.00 | 5 | 5 | — | REJECTED (−155.00 − 90.00 = −245.00) |
| — | **Close Day 5** (before E9) | | | 6, 7, 8 | FEE-ACC-001-D2, -D4, -D5 |
| 9 | E9 REVERSAL of E7 (CREDIT 620.00) | 6 | 2 | 9 | |
| 10 | E10 CREDIT ACC-002 3.334 / 3.333 / 3.333 | 5 | 5 | 10, 11, 12 | late: after the Day 5 close |
| — | **Final window close (Day 6)** | | | 13, 14 | fees: none; INT-ACC-001 0.93; INT-ACC-002 0.008 |

## R2. Proposed printed values per day (HC-1 recommended: as known at that day's close)

Closing balance = `balanceAsKnownAt(account, N, boundary after close N)`.

| Day | Boundary | ACC-001 | Calculation | ACC-002 | Fees assessed | Authorization states | Errors |
|-----|----------|---------|-------------|---------|---------------|----------------------|--------|
| 1 | 2 | 250.00 [25000] | 1,200.00 − 950.00 | 0.000 | none | none | none |
| 2 | 2 | 250.00 [25000] | hold is not a ledger entry | 0.000 | none | Auth-A APPROVED 200.00 | none |
| 3 | 3 | 650.00 [65000] | 250.00 + 400.00 | 0.000 | none | Auth-A APPROVED 200.00 | none |
| 4 | 4 | 465.00 [46500] | 650.00 − 185.00 | 0.000 | none | Auth-A SETTLED 185.00 | E6 Auth-Z rejected |
| 5 | 8 | −230.00 [−23000] | 465.00 − 620.00 − 3 × 25.00 | 0.000 | D2, D4, D5 × AED 25.00 | Auth-A SETTLED 185.00; Auth-B REJECTED 90.00 | none |
| 6 | 14 | 390.93 [39093] | 390.00 + 0.93 | 10.008 [10008] | none | Auth-A SETTLED 185.00; Auth-B REJECTED 90.00 | none |

Day 5 pre-fee value (not printed): −155.00. ACC-002 Day 5 is 0.000 because E10 is not yet known at
the Day 5 close. Day 6 ACC-002: 10.000 + 0.008. The calculation supporting the Day 6 capitalized-interest entries is: ACC-001 accruals 0.10, 0.09,
0.25, 0.17, 0.16, 0.16 = 0.93; ACC-002 0.000 × 4, 0.004, 0.004 = 0.008 (Spec 3 HC-15).

### Final value-dated table (after the final close, boundary 14)

| Value day | ACC-001 | ACC-002 |
|-----------|---------|---------|
| 1 | 250.00 | 0.000 |
| 2 | 225.00 | 0.000 |
| 3 | 625.00 | 0.000 |
| 4 | 415.00 | 0.000 |
| 5 | 390.00 | 10.000 |
| 6 | 390.93 | 10.008 |

Days 1–5 are Spec 3 HC-15 "after E9"; Day 6 adds capitalization (approved Spec 3 assertions
`39093n`, `10008n`).

## R3. Proposed output text (HC-6)

Two-space indentation, one account per line, `format()` output (Spec 1 R7: no thousands separators).
Fixed ordering: accounts ACC-001, ACC-002; fees by value day; authorizations by first appearance.

```text
Day 1
  Events: E1, E2
  Closing ledger balance:
    ACC-001 AED 250.00
    ACC-002 BHD 0.000
  Fees assessed: none
  Authorizations: none
  Errors: none

Day 2
  Events: E3
  Closing ledger balance:
    ACC-001 AED 250.00
    ACC-002 BHD 0.000
  Fees assessed: none
  Authorizations:
    Auth-A ACC-001 AED 200.00 APPROVED
  Errors: none

Day 3
  Events: E4
  Closing ledger balance:
    ACC-001 AED 650.00
    ACC-002 BHD 0.000
  Fees assessed: none
  Authorizations:
    Auth-A ACC-001 AED 200.00 APPROVED
  Errors: none

Day 4
  Events: E5, E6
  Closing ledger balance:
    ACC-001 AED 465.00
    ACC-002 BHD 0.000
  Fees assessed: none
  Authorizations:
    Auth-A ACC-001 AED 185.00 SETTLED
  Errors:
    E6 settlement Auth-Z ACC-001 AED 180.00 REJECTED: no active authorization

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

Day 6
  Events: E9, E10 (late: event day 5)
  Closing ledger balance:
    ACC-001 AED 390.93
    ACC-002 BHD 10.008
  Fees assessed: none
  Interest capitalized:
    INT-ACC-001 ACC-001 AED 0.93
    INT-ACC-002 ACC-002 BHD 0.008
  Authorizations:
    Auth-A ACC-001 AED 185.00 SETTLED
    Auth-B ACC-001 AED 90.00 REJECTED
  Errors: none

Final value-dated closing ledger balances
  Day 1: ACC-001 AED 250.00, ACC-002 BHD 0.000
  Day 2: ACC-001 AED 225.00, ACC-002 BHD 0.000
  Day 3: ACC-001 AED 625.00, ACC-002 BHD 0.000
  Day 4: ACC-001 AED 415.00, ACC-002 BHD 0.000
  Day 5: ACC-001 AED 390.00, ACC-002 BHD 10.000
  Day 6: ACC-001 AED 390.93, ACC-002 BHD 10.008
```

The `Events:` line is not required by the assessment; it is proposed so the written order and the
late E10 are visible (HC-3). Daily accruals are not printed; they are documented in `README.md` /
calculation tables (HC-4, approved).

## R4. Checkpoint options

| HC | Options | Recommendation and reason |
|----|---------|---------------------------|
| HC-1 | A: as known at each close · B: final value-dated only · C: A + final table | **C.** A is what a day-by-day replay knows; B alone would print Day 2 = 225.00 with a Day 2 fee "assessed" before E7 existed and hide criterion 1's −370.00 story. The final table shows the restatements by E7/E9. |
| HC-2 | By processing close · by value day | **Processing close.** "Assessed" is when the fee was booked (event day 5); the value day is printed on each fee line. Authorization states and errors belong to the close of the event that produced them. |
| HC-3 | E10 in Day 6 (late) · E10 in Day 5 | **Day 6, labelled late.** Spec 3 HC-17: late events do not reopen a closed day. ACC-002 Day 5 prints 0.000 as known; final table shows 10.000 on value day 5. |
| HC-4 | Day 6 includes capitalization · excludes it | **Approved (2026-09-29)**: Day 6 closing balances include the capitalization entries (Spec 3 HC-10). The report prints the two capitalized-interest entries only. Daily accrual details remain documented in README/calculation tables and are not printed per day. The assessment asks per day only for balance, fees, authorization states, and errors. Precedent (supplied by the human): banking systems separate internal accrual (accrual journals, no customer advice) from capitalization/liquidation posted to the account — [Oracle FLEXCUBE accounting events](https://docs.oracle.com/cd/F75086_01/html/LN/LN17_AppdxB.htm), [Oracle FLEXCUBE automatic accrual](https://docs.oracle.com/cd/F50901_01/html/LN/LN12_Auto.htm), [SAP interest capitalization](https://help.sap.com/docs/LOCALIZATIONS_FOR_BANKING_SERVICES_FROM_SAP/372b9754aace462e90c8108efc4b797c/709e8a5123c23220e10000000a423f68.html). |
| HC-5 | Errors = E6 only · E6 + E8 | **E6 only.** E8 is a valid authorization request that was declined (a state, Spec 2 HC-3); E6 references an absent authorization. The replay records the returned `REJECTED` settlement; it does not catch thrown exceptions (none occur in the stream). Error text: see R3; alternative reason text "authorization not found" would need an extra `lookup` branch. |
| HC-6 | Text in R3 · table layout · JSON | **R3 text.** Deterministic, no locale, no timestamps. |
| HC-7 | Latest record amount · hold amount + settled amount | **Latest record** (what `lookup` returns): Auth-A shows 200.00 APPROVED, then 185.00 SETTLED. Auth-Z is never listed (criterion 4: not present). |
| HC-8 | E10 as total + `instalments: 3` · three pre-split events | **Total + instalments**, matching the assessment text; replay splits with `allocateEqually` and posts with `appendAll` (Spec 1 HC-1, HC-2). |
| HC-9 | Replace `src/run.ts` and delete smoke test · new `src/main.ts` beside placeholder | **Replace.** `npm start` already targets `src/run.ts`; the placeholder has no assessment purpose. Test count: 93 − 1 smoke test. |
| HC-10 | See R5 | **Duplicate reversal.** |
| HC-11 | — | Accept 1, 3, 4, 5; reject 2, 6, 7, 8 (Spec 1 HC-1/HC-3, Spec 2 HC-10, Spec 3 HC-14). A README table lists all eight. |
| HC-12 | See R6 | |
| HC-13 | Result + stdout · stdout only | **Both**: structured assertions (R2, criteria) and one exact-stdout test of `npm start`'s command. |

## R5. Intentional failing test (HC-10)

**Proposed limitation — a reversal can be applied twice.** Spec 3 HC-6/HC-7 keep the reversal link
only in the request; `reverse()` checks that the target matches exactly one entry, and E7 still
matches exactly one entry after E9. A second reversal of E7 is therefore accepted and appends another
AED 620.00 credit, creating money.

- Test (synthetic, fresh ledger): E1, E2, E7 as in the stream; reverse E7 as `E9`; reverse E7 again as
  `E9-DUP`. Expected by the design intent: the second call throws `InvalidReversalTargetError`.
  Actual: it appends; ACC-001 Day 2 = 250.00 − 620.00 + 620.00 + 620.00 = 870.00 [87000] instead of
  250.00.
- Inline annotation: what fails, why (link not persisted, AMBIGUITIES "Reversal of E7"), and the fix
  (persist `reverses`, or reject a target already reversed) — not implemented, because that changes
  Spec 1 types.
- File: `test/limitations/duplicate-reversal.limitation.ts` (not `*.test.ts`).
- `npm test`: `node --test "test/**/*.test.ts"` — runs the normal passing tests and excludes the limitation.
- `npm run test:limitation`: `node --test test/limitations/duplicate-reversal.limitation.ts` — exits 1.
- Typecheck still covers it (`tsconfig` includes `test/`).

Alternatives: (b) over-settlement — settling Auth-A for more than its hold is accepted (Spec 2 HC-8
limitation); (c) fee-id collision — an unrelated entry named `FEE-ACC-001-D2` suppresses the fee
(Spec 3 HC-3). (a) is recommended: it follows directly from our own reversal design and breaks the
append-only correction model with real money.

Verified in a scratch directory: plain `node --test` runs every `.ts` under `test/` (exit 1 with a
failing file); an explicit `"test/**/*.test.ts"` glob skips it; the explicit file command exits 1.

## R6. Constants for `NUMBERS.md` (HC-12)

| Constant | Value | Source | Why not half |
|----------|-------|--------|--------------|
| AED precision | 2 dp | Assessment | 1 dp cannot hold fils |
| BHD precision | 3 dp | Assessment | 2 dp would lose fils (E10 3.334) |
| Overdraft fee | AED 25.00 [2500] | Assessment | Fixed by the rule |
| Daily rate | 4 at scale 4 (0.04%) | Assessment | Scale 4 is the smallest exact integer form |
| Window | Days 1–6 | Assessment | |
| E10 instalments | 3; remainder to first | Assessment; Spec 1 HC-1 | |
| Rounding | half up per accrual | Spec 3 HC-11 | |
| First replay sequence | 1 (0 = empty boundary) | Spec 1 FR-010/FR-012 | |
| Fee id | `FEE-<account>-D<day>` | Spec 3 HC-3 | |
| Interest id | `INT-<account>` | Spec 3 HC-10 | |
| Close cutoff | before first higher event day; final after last event | Spec 3 HC-17 | |
