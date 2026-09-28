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
