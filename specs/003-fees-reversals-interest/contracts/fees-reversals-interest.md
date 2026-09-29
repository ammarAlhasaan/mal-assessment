# Contract: Fees, Reversals, and Interest

Proposed signatures; each is confirmed at the start of its cycle and updated to match what is built.

| Function | Module | Behaviour | Cycle |
|----------|--------|-----------|-------|
| `assessOverdraftFees(ledger, accountId, assessmentDay)` | `src/fees/fees.ts` | Appends one AED 25.00 DEBIT per uncharged negative value day 1…assessmentDay, ascending; returns the new entries | 1 |
| `reverse(ledger, request)` | `src/reversals/reversals.ts` | Appends the compensating entry for `targetEventId`; throws before appending if the target is unknown | 2 |
| `applyRate(amount, rate)` | `src/money/money.ts` | `amount × rate.amount / 10^rate.scale`, rounded half up to the currency precision | 3 |
| `dailyInterestAccruals(ledger, accountId)` | `src/interest/interest.ts` | Rounded accrual for each of Days 1–6; zero for non-positive closing balances | 4 |
| `capitalizeInterest(ledger, accountId)` | `src/interest/interest.ts` | Appends one CREDIT equal to the sum of the accruals, value day 6 | 5 |
