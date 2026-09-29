# Contract: Fees, Reversals, and Interest

Proposed signatures; each is confirmed at the start of its cycle and updated to match what is built.

| Function | Module | Behaviour | Cycle |
|----------|--------|-----------|-------|
| `assessOverdraftFees(ledger, accountId, assessmentDay)` | `src/fees/fees.ts` | Appends one AED 25.00 DEBIT per uncharged negative value day 1…assessmentDay, ascending; returns the new, frozen list of entries; fee id `FEE-<account>-D<day>`, event day = assessmentDay | 1 — built |
| `reverse(ledger, request)` | `src/reversals/reversals.ts` | Appends the compensating entry for `targetEventId`; opposite direction, target's account and amount, the request's id/event day/value day; throws `InvalidReversalTargetError` before appending unless the target matches exactly one entry | 2 — built |
| `applyRate(amount, rate)` | `src/money/money.ts` | `amount × rate.amount / 10^rate.scale` (rate is `{amount: bigint, scale: bigint}`), rounded half up to the currency precision | 3 — built |
| `dailyInterestAccruals(ledger, accountId)` | `src/interest/interest.ts` | Rounded accrual for each of Days 1–6; zero for non-positive closing balances. **Precondition**: called at the pre-capitalization boundary — after capitalization, Day 6 would include the capitalization credit | 4 — built |
| `capitalizeInterest(ledger, accountId)` | `src/interest/interest.ts` | Computes and sums the accruals first, then appends one CREDIT equal to the sum, value day 6; never reads accruals after appending | 5 |
