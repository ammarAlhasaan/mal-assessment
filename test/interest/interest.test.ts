import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {money} from "../../src/money/money.ts";
import {createLedger} from "../../src/ledger/ledger.ts";
import type {Day, EntryDirection, Ledger} from "../../src/ledger/types.ts";
import {dailyInterestAccruals} from "../../src/interest/interest.ts";

function aedLedger(): Ledger {
    return createLedger([{id: "ACC-1", currency: "AED"}]);
}

function post(ledger: Ledger, direction: EntryDirection, minorUnits: bigint, eventDay: Day, valueDay: Day) {
    ledger.append({eventId: "E", accountId: "ACC-1", direction, amount: money(minorUnits, "AED"), eventDay, valueDay});
}

function aed(...minorUnits: bigint[]) {
    return minorUnits.map((units) => money(units, "AED"));
}

describe("daily interest accruals", () => {
    // [Assessment] 0.04% of each day's positive closing balance, rounded to AED precision
    test("accrues on each positive closing day", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 25000n, 1, 1);
        post(ledger, "CREDIT", 16500n, 3, 3);

        // Days 1-2: 250.00 -> 10; Days 3-6: 415.00 -> 16.6 -> 17
        assert.deepEqual(dailyInterestAccruals(ledger, "ACC-1"), aed(10n, 10n, 17n, 17n, 17n, 17n));
    });

    // [Assessment] positive balances only
    test("accrues nothing on zero or negative days", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 10000n, 1, 1);
        post(ledger, "DEBIT", 10000n, 2, 2);
        post(ledger, "DEBIT", 5000n, 3, 3);
        post(ledger, "CREDIT", 30000n, 4, 4);

        // 100.00 -> 4; 0.00 -> 0; -50.00 -> 0; 250.00 -> 10
        assert.deepEqual(dailyInterestAccruals(ledger, "ACC-1"), aed(4n, 0n, 0n, 10n, 10n, 10n));
    });

    // [Approved decision: HC-9] final value-dated balances, including entries posted later
    test("uses back-valued entries posted after the day", () => {
        const ledger = aedLedger();
        post(ledger, "CREDIT", 10000n, 1, 1);
        post(ledger, "DEBIT", 10000n, 5, 2);

        // Day 1: 100.00 -> 4; Days 2-6: 0.00 -> 0
        assert.deepEqual(dailyInterestAccruals(ledger, "ACC-1"), aed(4n, 0n, 0n, 0n, 0n, 0n));
    });
});