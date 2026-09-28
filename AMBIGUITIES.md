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

It is not clear whether E10 should be one ledger entry or three. I chose three
credit entries because the assessment says it is posted as three instalments.
They all use event ID E10, account ACC-002, event day 5, and value day 5.
