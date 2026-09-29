import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {money} from "../../src/money/money.ts";
import {createLedger} from "../../src/ledger/ledger.ts";
import type {Ledger} from "../../src/ledger/ledger.ts";
import {InvalidReversalTargetError, reverse} from "../../src/reversals/reversals.ts";
import type {ReversalRequest} from "../../src/reversals/types.ts";

function ledgerWithBackValuedDebit(): Ledger {
    const ledger = createLedger([{id: "ACC-1", currency: "AED"}]);
    ledger.append({eventId: "E1", accountId: "ACC-1", direction: "CREDIT", amount: money(10000n, "AED"), eventDay: 1, valueDay: 1});
    ledger.append({eventId: "E2", accountId: "ACC-1", direction: "DEBIT", amount: money(3000n, "AED"), eventDay: 3, valueDay: 1});
    return ledger;
}

const reversal: ReversalRequest = {eventId: "R1", targetEventId: "E2", eventDay: 4, valueDay: 1};

describe("reversal", () => {
    // [Assessment; Approved decision: HC-6] opposite direction, target's account and amount, reversal's own id and days
    test("appends the compensating entry", () => {
        const ledger = ledgerWithBackValuedDebit();

        const {sequence, ...entry} = reverse(ledger, reversal);

        assert.deepEqual(entry, {
            eventId: "R1",
            accountId: "ACC-1",
            direction: "CREDIT",
            amount: money(3000n, "AED"),
            eventDay: 4,
            valueDay: 1,
        });
    });

    // [Assessment] append-only: the reversed entry is never mutated or deleted
    test("keeps the reversed entry unchanged", () => {
        const ledger = ledgerWithBackValuedDebit();
        const before = ledger.entries("ACC-1");

        reverse(ledger, reversal);

        const after = ledger.entries("ACC-1");
        assert.equal(after.length, before.length + 1);
        assert.deepEqual(after.find((entry) => entry.eventId === "E2"), before[1]);
    });

    // [Assessment] the reversal cancels the target's balance effect
    test("returns the balance to its value before the reversed entry", () => {
        const ledger = ledgerWithBackValuedDebit();

        reverse(ledger, reversal);

        // 100.00 - 30.00 + 30.00 = 100.00
        assert.deepEqual(ledger.balanceByValueDay("ACC-1", 1), money(10000n, "AED"));
    });

    // [Constitution II; Approved decision: HC-7] invalid input is rejected before anything is appended
    test("rejects an unknown target without appending", () => {
        const ledger = ledgerWithBackValuedDebit();
        const before = ledger.lastSequence();

        assert.throws(
            () => reverse(ledger, {...reversal, targetEventId: "E9"}),
            InvalidReversalTargetError,
        );
        assert.equal(ledger.lastSequence(), before);
    });
});