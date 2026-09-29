# Rejected Acceptance Criteria

## Criterion 7 — Rejected

> The three BHD instalments in E10 must each be BHD 3.334.

Three instalments of BHD 3.334 total BHD 10.002:

`3334 + 3334 + 3334 = 10002 minor units`

E10 is only BHD 10.000, or 10000 minor units. Accepting this criterion would
create BHD 0.002 and violate exact total preservation.

I instead allocate E10 as BHD 3.334, BHD 3.333, and BHD 3.333. These instalments
sum exactly to BHD 10.000 and differ by no more than one minor unit.

## Criterion 2 — Rejected

> E7 causes exactly one overdraft fee to be assessed, on Day 2.

E7 is a debit of AED 620.00 posted on Day 5 with value day 2. It lowers the
closing balance of every value day from Day 2 onward. At the Day 5 close, days
are checked in order and each fee counts in later days:

| Value day | Before fee | Calculation | Fee | After fee |
|-----------|------------|-------------|-----|-----------|
| 1 | 250.00 | 1,200.00 − 950.00 | no | 250.00 |
| 2 | −370.00 | 250.00 − 620.00 | yes | −395.00 |
| 3 | 5.00 | −395.00 + 400.00 | no | 5.00 |
| 4 | −180.00 | 5.00 − 185.00 | yes | −205.00 |
| 5 | −205.00 | no Day 5 entry | yes | −230.00 |

E7 therefore causes three fees: Days 2, 4, and 5 (AED 75.00). Without the Day 2
fee, Days 4 and 5 would still be −155.00, so the count does not depend on fee
order. Charging only the current day would give one fee, but on Day 5, not
Day 2. No reading of the fee rule gives exactly one fee on Day 2.

## Criterion 6 — Rejected

> After E9, all balances and fees return to their pre-E7 values.

E9 appends a credit of AED 620.00 with value day 2. It cancels E7's principal
on every value day, but the three fees assessed at the Day 5 close remain: the
ledger is append-only, the fees were correct on what was known at that close,
and the stream contains no refund event.

| Value day | Pre-E7 | After E9 | Difference |
|-----------|--------|----------|------------|
| 1 | 250.00 | 250.00 | 0.00 |
| 2 | 250.00 | 225.00 | −25.00 |
| 3 | 650.00 | 625.00 | −25.00 |
| 4 | 465.00 | 415.00 | −50.00 |
| 5 | 465.00 | 390.00 | −75.00 |
| 6 | 465.00 | 390.00 | −75.00 |

Pre-E7 there were no fees; after E9 there are three. Even a refund would be a
new entry beside the fees, not their removal. E8 (Auth-B), rejected while E7
was in effect, also stays rejected.

## Criterion 8 — Rejected

> If the rounded daily interest accruals do not sum to the capitalized total,
> the remainder is discarded.

The rule requires the rounded daily accruals to sum exactly to the capitalized
total. The capitalized total is therefore defined as that sum, so there is
never a remainder to discard.

ACC-001's accruals at 0.04% on the final closing balances, rounded half up:

| Day | Balance | Exact (minor units) | Rounded |
|-----|---------|---------------------|---------|
| 1 | 250.00 | 10.0 | 0.10 |
| 2 | 225.00 | 9.0 | 0.09 |
| 3 | 625.00 | 25.0 | 0.25 |
| 4 | 415.00 | 16.6 | 0.17 |
| 5 | 390.00 | 15.6 | 0.16 |
| 6 | 390.00 | 15.6 | 0.16 |

The capitalized total is 10 + 9 + 25 + 17 + 16 + 16 = 93, or AED 0.93. Rounding
the exact total of 91.8 would give AED 0.92 and leave the accruals and the
capitalization one minor unit apart. ACC-002 capitalizes BHD 0.004 + 0.004 =
BHD 0.008.
