# Ambiguities

## E10 equal instalments

E10 is described as BHD 10.000 posted as three equal instalments. Exact equality
is impossible at BHD's three-decimal precision because 10000 minor units cannot
be divided evenly by 3.

I interpret “equal” as differing by no more than one minor unit while preserving
the original total exactly.

The assessment does not specify which instalment receives the remainder. I assign
remainder minor units from the first instalment onward. Therefore E10 is allocated
as BHD 3.334, BHD 3.333, and BHD 3.333.

## How E10 is posted

It is not clear whether E10 should be one ledger entry or three. I use three
credit entries because the assessment says it is posted as three instalments.
All three entries share the E10 event ID, so they remain linked to the same
business event. They are added together so a partial E10 cannot be recorded.

This follows the common ledger pattern of grouping multiple entries under one
transaction or business event:

- [Stripe Transaction Entries](https://docs.stripe.com/api/treasury/transaction_entries)
- [Modern Treasury ledger objects](https://docs.moderntreasury.com/ledgers/docs/guide-to-ledger-objects)
- [Modern Treasury ledger guarantees](https://docs.moderntreasury.com/ledgers/docs/ledgers-guarantees)

## E10 replay position

E10 is dated Day 5 but appears after the Day 6 event E9. I keep the written
replay order and do not reorder the ledger by date. Each entry keeps its event
day and value day, while a separate sequence records when it was added. This
allows late or back-dated entries without changing the append-only history.

This follows ledger systems that keep creation or posting order separate from
the date when an entry affects the balance:

- [Stripe Transaction Entries](https://docs.stripe.com/api/treasury/transaction_entries/list)
- [Modern Treasury prior ledger states](https://docs.moderntreasury.com/ledgers/docs/verify-prior-ledger-states)
- [AWS event sourcing](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing-pattern.html)

## Criterion 1 evaluation boundary

Criterion 1 asks for the Day 2 closing balance "evaluated at end of Day 5 and
before any fee is assessed". I read this as a knowledge boundary, not a value
day: the balance for value day 2 using only entries appended up to the end of
Day 5 in the replay order, before any fee entry.

The boundary is the replay sequence of the last entry appended before the first
Day 6 event (E9). E10 is dated Day 5 but appears after E9 in the replay order,
so it falls outside this boundary. It posts to ACC-002, so it cannot change the
ACC-001 result either way.

Within Spec 1 the entries inside the boundary are E1, E2, E4, and E7. The Day 2
balance is 1,200.00 − 950.00 − 620.00 = AED −370.00 (E4 has value day 3 and is
excluded), so criterion 1 is accepted. It must be re-checked once
authorizations, settlements, and fees exist, in case any of them affect ACC-001
with a value day on or before Day 2 inside the boundary.

## Invalid ledger input

The assessment defines the valid event stream but does not say how malformed
runtime input should be handled. Because the ledger is append-only, a bad entry
could never be removed. I therefore reject it before anything is stored and
without consuming a replay sequence:

- an unknown account or a duplicate account id when the ledger is created;
- an amount in a different currency from the account, a non-integer amount, or
  a zero or negative amount;
- a direction other than CREDIT or DEBIT;
- an event day or value day outside Day 1 to Day 6.

Balance queries reject value days outside Day 1 to Day 6 and boundaries outside
0 to the last assigned sequence, rather than silently returning zero or the
full balance.

## Authorization decision boundary and hold timing

An authorization is evaluated at its written replay position. The ledger
balance is the balance for the authorization's value day using the entries
known at that point, and the active holds are those established but not closed
at that point. A hold starts when its authorization is processed; its recorded
value day does not back-date the hold itself.

This makes E3 approved: AED 1,200.00 − AED 950.00 − AED 200.00 leaves
AED 50.00 available. E7 is processed before E8, so E8 sees ledger balance
AED −155.00 and its AED 90.00 request is rejected because the result would be
AED −245.00.

Authorization records use their append order as the current knowledge order.
A separate cross-store replay sequence was not needed for the Spec 2 events and
is deferred until a later specification requires historical authorization
queries.

## Authorization outcomes and rejected requests

Approved and rejected authorization requests are retained as immutable records.
Only the latest `APPROVED` outcome for an authorization contributes an active
hold. An accepted settlement adds a new immutable `SETTLED` record; it does not
change the original authorization record.

A rejected settlement is returned as a frozen `REJECTED` outcome but is not
stored in authorization history. Therefore E6 does not make Auth-Z present.
The replay layer must retain the returned rejection if it needs to print the
error in the final report.

## Settlement smaller than its hold

E5 settles Auth-A for AED 185.00 against its AED 200.00 hold. I treat this as a
final settlement: the complete hold closes and the unused AED 15.00 is released
immediately. The assessment provides no later partial capture or release event,
so retaining the remainder would leave it held indefinitely.

A settlement is accepted only when the authorization's latest outcome is
`APPROVED`. Settling a rejected or already-settled authorization is rejected
without a ledger posting.

## Settlement consistency limitation

An accepted settlement validates the supported precondition, prepares its
immutable outcome, appends the ledger debit, and then records `SETTLED`. This is
failure-atomic for anticipated errors in this synchronous in-memory model, but
it is not crash-atomic: a process failure between the two writes could leave a
debit with the hold still active. A shared transactional store would be needed
to remove this production risk.

## Spec 2 validation boundaries

The assessment stream contains no duplicate authorization ID, settlement above
the authorized amount, or settlement whose account or currency differs from
the authorization. Spec 2 does not define those cases, except that a settlement
for a non-active authorization is rejected. These are documented limitations,
not implied acceptance behavior.

Acceptance criteria 3 and 4 are accepted. Criterion 5 is also accepted as a
conditional rule; Auth-B is rejected in the supplied stream, so the rule is
demonstrated by Auth-A and the focused authorization tests instead. Criterion 1
remains AED −370.00 after adding E5 because E5 has value day 4 and does not
affect the Day 2 closing balance.

## Overdraft fees on back-valued days

The fee rule defines a day's closing balance by value date, so a back-valued
debit can make an earlier day negative after that day has closed. E7 arrives on
Day 5 with value day 2. Each assessment therefore checks every value day from
Day 1 to the assessment day and charges each negative day that has no fee yet.
The fee's value day is the charged day; its event day is the assessment day, so
the ledger still shows when the fee became known.

Days are checked in ascending order and a fee already booked counts in later
days' closing balances, because it is an entry with an earlier value day. In the
assessment stream this does not change which days are charged.

A fee's event id is `FEE-<account>-D<day>`. A day is already charged when the
ledger holds that id, so repeating an assessment never charges a day twice.
Limitation: another posting that used the same id would be treated as a fee.

The fee is written in AED. ACC-002 (BHD) is never negative in the window, so no
BHD fee arises; the ledger's currency check would reject an AED fee on a BHD
account.

## Processing cutoffs

The assessment does not say when end-of-day processing runs relative to the
written stream, and the stream is not in day order: E10 (Day 5) follows E9
(Day 6). The written order is never changed.

- The daily close for Days 1 to 5 runs at the day rollover, immediately before
  the first written event with a higher event day. It assesses fees. The Day 5
  close therefore runs after E8 and before E9.
- A late event such as E10 does not reopen a closed day. It reaches the
  balances through its value day at the next close.
- The final window close runs after the last written event, E10: fee
  reassessment for Days 1 to 6, then interest and one capitalization credit per
  account.

A single cutoff after the last event for everything was rejected: fees would
only be assessed after E9 had cancelled E7, so no fee would ever be charged and
criterion 1's "before any fee is assessed" would have no meaning.

This matches common banking practice: posting date and value date are
separate, the event record is append-only, and back-dated entries recalculate
the affected days' balances afterwards rather than delaying the daily close:

- [SAP — Value Date](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e200555127f24878bed8d1481c9d5a0b/86686d7218d34f7fb8a4b14780ec9385.html)
- [AWS — Event Sourcing](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing-pattern.html)
- [Oracle — Backdated Transactions and Average Balances](https://docs.oracle.com/en/cloud/saas/financials/25d/faugl/backdated-transactions-and-average-balances.html)
- [Oracle FLEXCUBE — Interest Recalculation](https://docs.oracle.com/cd/E86273_01/html/Int_Chargs/IC09_Int_Apli.htm)

## Reversal of E7

E9 reverses E7 without changing it. The reversal appends one new entry in the
opposite direction with E7's account and amount (a CREDIT of AED 620.00). It
keeps its own event id, event day (Day 6), and value day (Day 2) from E9. The
reversal relationship exists only in the input event (the reversal request's
target id). The ledger stores only the resulting compensating posting and does
not persist the target id, because the assessment never asks to query that link
later and persisting it would change the Spec 1 entry types. As a consequence,
the ledger alone cannot show which entry a reversal cancelled.

A reversal target must match exactly one ledger entry, otherwise the reversal
is rejected before anything is appended. The stream has no multi-entry target,
repeated reversal, or reversal of a reversal, so these are limitations rather
than tested behaviour.

Fees assessed while E7 was in effect remain after E9. They were correct on what
was known at the end of Day 5, the ledger is append-only, and the stream
contains no fee-refund event. A refund would have to be its own compensating
entry.

## Interest rate and rounding

The daily rate 0.04% is applied as 4 × 10⁻⁴ in exact integer arithmetic inside
the money adapter, the only place allowed to round money. Each result is
rounded to its currency's precision: 2 decimal places for AED, 3 for BHD.

The assessment requires rounded daily accruals but does not name a rounding
mode. I round half up. The assessment's own balances produce no exact half
(the fractional accruals are 16.6, 15.6, and 15.6 AED minor units), so half up
and half even give the same result there; rounding down would lower ACC-001's
interest from AED 0.93 to AED 0.90. A half-unit case (AED 12.50 → AED 0.01) is
tested to fix the chosen mode.

## Interest accrual basis

Accruals stay uncapitalized until the end of Day 6, and the rule defines each
day's closing balance by value date. Each daily accrual therefore uses that
day's closing balance from all entries known at the final window close:
the fees, E9, and the late E10 are all included. Calculating each day only from
what was known at its own end would ignore E7 and E9's corrections to Days 2 to
5, and E10 on Day 5.

Days 1 to 6 all accrue. The capitalization credit itself earns no interest.
Because the accrual calculation reads the ledger as it stands, it must be done
before the capitalization credit is appended: capitalization computes and sums
the accruals first, appends one credit, and never recalculates them afterwards.

## Interest capitalization

At the final window close each account receives one credit, `INT-<account>`,
with event day 6 and value day 6. Its amount is the exact sum of the six
rounded daily accruals, so the rounded accruals always sum to the capitalized
total and no remainder exists to discard.

A zero total would be rejected by the ledger's positive-amount rule; it does not
occur in the window. Capitalization is performed once per account by the final
close and is not guarded against a second call.
