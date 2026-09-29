import {test} from "node:test";
import assert from "node:assert/strict";
import {createLedger} from "../../src/ledger/ledger.ts";
import {money} from "../../src/money/money.ts";
import {InvalidReversalTargetError, reverse} from "../../src/reversals/reversals.ts";

// INTENTIONALLY FAILING — run with `npm run test:limitation`; excluded from `npm test`.
//
// What it reveals: our design lets the same entry be reversed twice.
// `reverse()` only checks that the target event id matches exactly one ledger entry.
// The reversal link (E9 -> E7) lives only in the request and is never persisted
// (Spec 3 HC-6/HC-7, AMBIGUITIES.md "Reversal of E7"), and E7 itself is never changed,
// so after E9 the ledger cannot tell that E7 is already reversed. A second reversal
// is accepted and appends another AED 620.00 credit, creating money:
//   Day 2: 1,200.00 - 950.00 - 620.00 + 620.00 + 620.00 = 870.00 instead of 250.00.
//
// Fix (not implemented; it changes Spec 1 entry types): persist the reversed event id
// on the compensating entry and reject a target that already has a reversal.
test("rejects a second reversal of the same entry", () => {
    const ledger = createLedger([{id: "ACC-001", currency: "AED"}]);
    ledger.append({eventId: "E1", accountId: "ACC-001", direction: "CREDIT", amount: money(120000n, "AED"), eventDay: 1, valueDay: 1});
    ledger.append({eventId: "E2", accountId: "ACC-001", direction: "DEBIT", amount: money(95000n, "AED"), eventDay: 1, valueDay: 1});
    ledger.append({eventId: "E7", accountId: "ACC-001", direction: "DEBIT", amount: money(62000n, "AED"), eventDay: 5, valueDay: 2});
    reverse(ledger, {eventId: "E9", targetEventId: "E7", eventDay: 6, valueDay: 2});

    assert.throws(
        () => reverse(ledger, {eventId: "E9-DUPLICATE", targetEventId: "E7", eventDay: 6, valueDay: 2}),
        InvalidReversalTargetError,
    );
    assert.deepEqual(ledger.balanceByValueDay("ACC-001", 2), money(25000n, "AED"));
});
