import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {money} from "../../src/money/money.ts";
import {createLedger} from "../../src/ledger/ledger.ts";
import type {Day, EntryDirection, Ledger, LedgerEntry} from "../../src/ledger/types.ts";
import {assessOverdraftFees} from "../../src/fees/fees.ts";

function aedLedger(): Ledger {
    return createLedger([{id: "ACC-1", currency: "AED"}]);
}

function post(ledger: Ledger, direction: EntryDirection, minorUnits: bigint, eventDay: Day, valueDay: Day) {
    ledger.append({eventId: "E", accountId: "ACC-1", direction, amount: money(minorUnits, "AED"), eventDay, valueDay});
}

function fee(eventDay: Day, valueDay: Day) {
    return {
        eventId: `FEE-ACC-1-D${valueDay}`,
        accountId: "ACC-1",
        direction: "DEBIT",
        amount: money(2500n, "AED"),
        eventDay,
        valueDay,
    };
}

function withoutSequence(entries: readonly LedgerEntry[]) {
    return entries.map(({sequence, ...entry}) => entry);
}

describe("overdraft fee assessment", () => {
    // [Assessment] AED 25.00 when the day's closing balance is negative, value date = day assessed
    test("charges one AED 25.00 fee for a negative closing day", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 1000n, 1, 1);
        post(ledger, "DEBIT", 3000n, 1, 1);

        const fees = assessOverdraftFees(ledger, "ACC-1", 1);

        assert.deepEqual(withoutSequence(fees), [fee(1, 1)]);
        // 10.00 - 30.00 - 25.00 = -45.00
        assert.deepEqual(ledger.balanceByValueDay("ACC-1", 1), money(-4500n, "AED"));
    });

    // [Assessment] only negative balances are charged
    test("charges nothing for a zero closing balance", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 1000n, 1, 1);
        post(ledger, "DEBIT", 1000n, 1, 1);
        const before = ledger.lastSequence();

        assert.deepEqual(assessOverdraftFees(ledger, "ACC-1", 1), []);
        assert.equal(ledger.lastSequence(), before);
    });

    // [Assessment] once per day per account
    test("does not charge the same day twice", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 1000n, 1, 1);
        post(ledger, "DEBIT", 3000n, 1, 1);

        assessOverdraftFees(ledger, "ACC-1", 1);

        assert.deepEqual(assessOverdraftFees(ledger, "ACC-1", 1), []);
        assert.equal(ledger.entries("ACC-1").filter((entry) => entry.eventId === "FEE-ACC-1-D1").length, 1);
    });

    // [Approved decision: HC-1] a back-valued debit is charged on its value day at the next assessment
    test("charges an earlier day made negative by a back-valued debit", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 5000n, 1, 1);
        assert.deepEqual(assessOverdraftFees(ledger, "ACC-1", 1), []);

        post(ledger, "DEBIT", 6000n, 2, 1);
        const fees = assessOverdraftFees(ledger, "ACC-1", 2);

        // Day 1: 50.00 - 60.00 = -10.00 -> fee -> -35.00; Day 2: -35.00 -> fee -> -60.00
        assert.deepEqual(withoutSequence(fees), [fee(2, 1), fee(2, 2)]);
        assert.deepEqual(ledger.balanceByValueDay("ACC-1", 2), money(-6000n, "AED"));
    });

    // [Approved decision: HC-2] an earlier fee counts in later days' closing balances
    test("includes an earlier fee when assessing a later day", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 2000n, 1, 1);
        post(ledger, "DEBIT", 3000n, 1, 1);
        post(ledger, "CREDIT", 2000n, 2, 2);

        const fees = assessOverdraftFees(ledger, "ACC-1", 2);

        // Day 1: -10.00 -> fee -> -35.00; Day 2: -35.00 + 20.00 = -15.00 (+10.00 without the fee) -> fee -> -40.00
        assert.deepEqual(withoutSequence(fees), [fee(2, 1), fee(2, 2)]);
        assert.deepEqual(ledger.balanceByValueDay("ACC-1", 2), money(-4000n, "AED"));
    });
});