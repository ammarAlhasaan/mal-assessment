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
