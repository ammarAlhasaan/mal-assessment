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

E9 appends a credit of AED 620.00 with value day 2. It reverses E7 only. It
does not reverse the fee entries already assessed at the Day 5 close, and the
event stream contains no event that refunds fees. The Day 6 close re-checks
every value day, finds no new negative day, and assessment only ever adds fees,
so the three fees remain. Append-only alone does not force this: if policy
required a refund, it would be represented by additional compensating entries.

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

# Abandoned Approaches

Approaches we considered and dropped during the build, with the reason. The approved choices are in
`AMBIGUITIES.md`.

## One processing cutoff after the last event

Running all fee assessment and interest once, after E10, was the simplest replay. It was abandoned
because fees would only be assessed after E9 had cancelled E7: no day would be negative, no fee would
ever be charged, criterion 1's "before any fee is assessed" would have no meaning, and interest would
be AED 1.03. We close each day at the day rollover instead.

## Checking only the current day for fees

Assessing a fee only for day N at the close of day N would charge one fee on Day 5 for E7. It was
abandoned because the fee rule defines a day's closing balance by value date, and E7 also makes Days 2
and 4 negative. We check every value day up to N.

## Rounding only the interest total

Summing the exact daily interest and rounding once gives AED 0.92 for ACC-001. It was abandoned
because the rounded daily accruals (10 + 9 + 25 + 17 + 16 + 16 = 93) would then not sum to the
capitalized total, which the rule forbids.

## Calculating interest as known at each day

Accruing each day on the balance known at that day's end gives AED 0.81 for ACC-001 and BHD 0.004 for
ACC-002. It was abandoned because accruals stay uncapitalized until Day 6, so the corrections from E7,
E9, and the late E10 must be included.

## Keeping Auth-A's unused hold

Keeping the AED 15.00 that Auth-A did not settle as an active hold was abandoned because the stream has
no release event, so it would stay held for the rest of the window. The whole hold closes at
settlement.

## Storing the reversal link on the ledger entry

Adding a `reverses` field to the ledger entry would let the ledger reject a second reversal. It was
not built because it changes the Spec 1 entry types and the assessment never queries the link. The
cost of that choice is the intentionally failing test.

## Refunding fees after the reversal

Automatically refunding the three fees after E9 would make criterion 6 true. It was abandoned because
the fees were correct on what was known at the Day 5 close and the stream has no refund event. A refund
would have been possible as new compensating entries; it was a policy choice, not an append-only limit.

## Printing daily accruals, or only one view of each day

Printing each day's interest accrual was dropped because the assessment asks per day only for the
balance, fees, authorization states, and errors; accruals are documented in `README.md` instead.
Printing only the final value-dated balances, or only the as-known ones, was dropped because each alone
hides half of what the back-valued events did; the report prints both.
