# Data Model: Fees, Reversals, and Interest

No new ledger entity. Fees, reversals, and capitalizations are ordinary Spec 1 `LedgerEntry` values
(pending HC-3, HC-6, HC-10):

| Entry | eventId | Direction | Amount | eventDay | valueDay |
|-------|---------|-----------|--------|----------|----------|
| Overdraft fee | `FEE-<account>-D<d>` | DEBIT | AED 25.00 | assessment day | charged day *d* |
| Reversal | reversal event id (`E9`) | opposite of target | target amount | reversal event day | reversal value day |
| Capitalization | `INT-<account>` | CREDIT | sum of rounded accruals | 6 | 6 |

New input type (cycle 2): `ReversalRequest { eventId, targetEventId, eventDay, valueDay }`.
Daily accruals are derived values (`Money[]`, Days 1–6), not stored.
