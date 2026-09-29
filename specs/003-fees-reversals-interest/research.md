# Research: Fees, Reversals, and Interest

All values are **proposed, pending human approval (HC-15)**. Minor units in brackets.

## R1. Calculation tables

### ACC-001 ledger entries (proposed replay order)

| Seq order | Event | Direction | Amount | Event day | Value day |
|-----------|-------|-----------|--------|-----------|-----------|
| 1 | E1 | CREDIT | 1,200.00 [120000] | 1 | 1 |
| 2 | E2 | DEBIT | 950.00 [95000] | 1 | 1 |
| — | E3 Auth-A hold (no ledger entry) | — | 200.00 | 2 | 2 |
| 3 | E4 | CREDIT | 400.00 [40000] | 3 | 3 |
| 4 | E5 settle Auth-A | DEBIT | 185.00 [18500] | 4 | 4 |
| — | E6 Auth-Z rejected (no entry) | — | — | 4 | 4 |
| 5 | E7 | DEBIT | 620.00 [62000] | 5 | 2 |
| — | E8 Auth-B rejected (no entry) | — | — | 5 | 5 |
| 6 | FEE-ACC-001-D2 | DEBIT | 25.00 [2500] | 5 | 2 |
| 7 | FEE-ACC-001-D4 | DEBIT | 25.00 [2500] | 5 | 4 |
| 8 | FEE-ACC-001-D5 | DEBIT | 25.00 [2500] | 5 | 5 |
| 9 | E9 reverses E7 | CREDIT | 620.00 [62000] | 6 | 2 |
| — | E10 (ACC-002, three BHD credits) | — | — | 5 | 5 |
| 10 | INT-ACC-001 | CREDIT | 0.93 [93] | 6 | 6 |

### Fee assessment at the end of each day (HC-1 Option A, HC-2)

| End of day | New knowledge | Closing balances checked (vd 1…N) | Fees booked |
|------------|---------------|-----------------------------------|-------------|
| 1 | E1, E2 | D1 250.00 | none |
| 2 | E3 (hold only) | D1 250.00, D2 250.00 | none |
| 3 | E4 | D1–D3: 250.00, 250.00, 650.00 | none |
| 4 | E5, E6 | D1–D4: 250.00, 250.00, 650.00, 465.00 | none |
| 5 | E7, E8 | see below | D2, D4, D5 |
| 6 | E9, E10 | D1–D6 all positive (see after E9) | none |

End of Day 5, ascending, each fee included in later days:

| Value day | Pre-fee closing | Calculation | Negative? | Fee | Closing after fee |
|-----------|-----------------|-------------|-----------|-----|-------------------|
| 1 | 250.00 [25000] | 1,200.00 − 950.00 | no | — | 250.00 |
| 2 | −370.00 [−37000] | 250.00 − 620.00 | yes | 25.00 | −395.00 [−39500] |
| 3 | 5.00 [500] | −395.00 + 400.00 | no | — | 5.00 |
| 4 | −180.00 [−18000] | 5.00 − 185.00 | yes | 25.00 | −205.00 [−20500] |
| 5 | −205.00 [−20500] | no Day 5 entry | yes | 25.00 | −230.00 [−23000] |

Without the Day 2 fee, Day 3 would be 30.00 and Day 4 −155.00: the same days are charged.
Total fees: 3 × 25.00 = 75.00 [7500].

### ACC-001 closing ledger balance by value day

| Value day | Pre-E7 (after E6) | After E8, pre-fee | After Day 5 fees | After E9 | E9 − pre-E7 |
|-----------|-------------------|-------------------|------------------|----------|-------------|
| 1 | 250.00 | 250.00 | 250.00 | 250.00 | 0.00 |
| 2 | 250.00 | −370.00 | −395.00 | 225.00 | −25.00 |
| 3 | 650.00 | 30.00 | 5.00 | 625.00 | −25.00 |
| 4 | 465.00 | −155.00 | −205.00 | 415.00 | −50.00 |
| 5 | 465.00 | −155.00 | −230.00 | 390.00 | −75.00 |
| 6 | 465.00 | −155.00 | −230.00 | 390.00 | −75.00 |

After E9 = after-fees + 620.00 for every value day ≥ 2 (e.g. D2: −395.00 + 620.00 = 225.00).
Day 6 closing after capitalization: 390.00 + 0.93 = 390.93 [39093].

### Interest (HC-9 Option A, HC-10, HC-11 half-up)

Accrual = balance × 4 / 10,000, in minor units, then rounded.

ACC-001 (AED, 2 dp):

| Day | Closing (after E9) | × 0.0004 (minor units, exact) | Rounded half-up |
|-----|--------------------|-------------------------------|-----------------|
| 1 | 250.00 [25000] | 25000 × 4 / 10000 = 10.0 | 0.10 [10] |
| 2 | 225.00 [22500] | 22500 × 4 / 10000 = 9.0 | 0.09 [9] |
| 3 | 625.00 [62500] | 62500 × 4 / 10000 = 25.0 | 0.25 [25] |
| 4 | 415.00 [41500] | 41500 × 4 / 10000 = 16.6 | 0.17 [17] |
| 5 | 390.00 [39000] | 39000 × 4 / 10000 = 15.6 | 0.16 [16] |
| 6 | 390.00 [39000] | 39000 × 4 / 10000 = 15.6 | 0.16 [16] |
| **Total** | | exact 91.8 → AED 0.918 | **0.93 [93]** |

10 + 9 + 25 + 17 + 16 + 16 = 93. Capitalized: **AED 0.93**. Rounding the exact total instead would
give 0.92 — one minor unit short of the rounded accruals (criterion 8).

ACC-002 (BHD, 3 dp): E10 = 3.334 + 3.333 + 3.333 = 10.000 [10000], value day 5.

| Day | Closing | × 0.0004 | Rounded |
|-----|---------|----------|---------|
| 1–4 | 0.000 | not positive | 0.000 |
| 5 | 10.000 [10000] | 10000 × 4 / 10000 = 4.0 | 0.004 [4] |
| 6 | 10.000 [10000] | 4.0 | 0.004 [4] |
| **Total** | | | **BHD 0.008 [8]** |

ACC-002 Day 6 closing after capitalization: 10.008 [10008]. ACC-002 is never negative: no fee.

### Sensitivity (informative only)

| Variant | ACC-001 interest | Note |
|---------|------------------|------|
| Proposed (A, half-up) | 0.93 | |
| Round down per accrual | 0.90 | 10+9+25+16+15+15 |
| Fees refunded after E9 (balances = pre-E7) | 1.03 | 10+10+26+19+19+19; not proposed (HC-5) |
| HC-9 Option B (as known each day) | 0.81 | 10+10+26+19+0+16 |

## R2. Decisions and alternatives

| Topic | Proposed | Rejected alternative | Why |
|-------|----------|----------------------|-----|
| Back-valued fees | Scan days 1…N | Current day only | Rule defines the balance by value date |
| Fee identity | Deterministic event id from the ledger | Separate fee store | No extra state; ledger is the record |
| Reversal link | In the request/return value | New optional field on Spec 1 types | Keeps Spec 1 unchanged |
| Fees after reversal | Retained | Auto-refund entries | No refund event in the stream |
| Interest basis | Final value-dated balances | Per-day snapshots | Accruals uncapitalized until Day 6 |
| Rounding | Half-up, per accrual | Round total only | Rule requires the rounded accruals to sum to the total |
| Rate math | New additive `src/money/` function | bigint math in the interest module | Constitution I |
