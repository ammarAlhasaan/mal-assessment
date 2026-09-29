# Numbers

Every constant in the ledger, where it comes from, and why it has this value and not half of it.
Values in brackets are integer minor units.

## Given by the assessment

| Constant | Value | Where | Why this value, not half |
|----------|-------|-------|--------------------------|
| AED precision | 2 decimal places | `src/money/money.ts` | Required. With 1 place, fils could not be stored: ACC-001's AED 0.93 interest would lose its last digit. |
| BHD precision | 3 decimal places | `src/money/money.ts` | Required. "Half" (1.5) is not a precision; with 2 places, E10's BHD 3.334 instalment and the BHD 0.008 interest could not be stored. |
| Overdraft fee | AED 25.00 [2500] | `src/fees/fees.ts` | Required. At AED 12.50 the same days (2, 4, 5) would be charged, but the total would be AED 37.50 instead of AED 75.00 and every later balance would differ. |
| Daily interest rate | 0.04% | `src/interest/interest.ts` | Required. At 0.02%, ACC-001's accruals would be 5 + 5 + 13 + 8 + 8 + 8 = AED 0.47 instead of AED 0.93, and ACC-002 would earn BHD 0.004 instead of BHD 0.008. |
| Window | Days 1–6 | `src/ledger/ledger.ts`, `src/replay/replay.ts` | Required. A three-day window would drop E4–E10, including every fee and the reversal. |
| E10 instalments | 3 | `src/replay/events.ts` | Required. "Half" (1.5) is not a number of instalments. |

## Chosen by us

| Constant | Value | Where | Why this value, not half |
|----------|-------|-------|--------------------------|
| Rate representation | 4 at scale 4 (4 × 10⁻⁴) | `src/interest/interest.ts` | Scale 4 is the smallest integer form of 0.04%, so the rate is exact without floating point. Half the amount (2) would be 0.02%, the wrong rate. |
| Rounding mode | Half up, per daily accrual, at the account's precision | `src/money/money.ts` (`applyRate`) | The assessment requires rounded daily accruals but names no mode. Rounding down gives AED 0.90. Rounding only the total (91.8 → 92) gives AED 0.92, which breaks "must sum exactly". The stream has no exact half, so half up and half even agree; a 12.50 → 0.01 test fixes the mode. |
| Rounding threshold | 0.5 minor unit | `applyRate` | Standard half-up. A 0.25 threshold would round 16.3 up to 17 and overstate interest. |
| E10 remainder | Extra minor unit to the first instalment | `src/money/money.ts` (`allocateEqually`) | 10,000 ÷ 3 leaves 1 minor unit. Giving it to the first instalment keeps the total exact and the parts at most 1 apart: 3.334, 3.333, 3.333. |
| Fee look-back | Value days 1…N at the close of day N | `src/fees/fees.ts` | Checking only day N would miss E7's back-valued effect on Days 2 and 4 and charge one fee on Day 5 only. |
| Daily-close cutoff | Immediately before the first event with a higher event day | `src/replay/replay.ts` | One cutoff after the last event would assess fees only after E9 cancelled E7: no fee at all and interest of AED 1.03. |
| Final close | After the last written event (E10) | `src/replay/replay.ts` | Closing Day 6 before E10 would leave ACC-002 without E10 and without interest. |
| First replay sequence | 1 | `src/ledger/ledger.ts` | 0 is reserved as the "nothing known yet" boundary for `balanceAsKnownAt`. |
| Fee id | `FEE-<account>-D<day>` | `src/fees/fees.ts` | One id per account and value day makes repeated assessment idempotent ("once per day per account"). |
| Interest id | `INT-<account>` | `src/interest/interest.ts` | One capitalization per account, at the end of Day 6. |
| Capitalization day | Event day 6, value day 6 | `src/interest/interest.ts` | "Capitalize as a single credit at end of Day 6." |
