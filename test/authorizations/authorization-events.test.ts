import {test} from "node:test";
import assert from "node:assert/strict";
import {createAuthorizations} from "../../src/authorizations/authorizations.ts";
import {createLedger} from "../../src/ledger/ledger.ts";
import type {Day, EntryDirection} from "../../src/ledger/types.ts";
import {money} from "../../src/money/money.ts";

test("replays E1–E8 and produces the approved authorization and settlement outcomes", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
        {id: "ACC-002", currency: "BHD"},
    ]);
    const authorizations = createAuthorizations(ledger);

    function post(eventId: string, direction: EntryDirection, minorUnits: bigint, eventDay: Day, valueDay: Day) {
        ledger.append({eventId, accountId: "ACC-001", direction, amount: money(minorUnits, "AED"), eventDay, valueDay});
    }

    function event(eventId: string, authorizationId: string, minorUnits: bigint, day: Day) {
        return {eventId, authorizationId, accountId: "ACC-001", amount: money(minorUnits, "AED"), eventDay: day, valueDay: day};
    }

    post("E1", "CREDIT", 120000n, 1, 1);
    post("E2", "DEBIT", 95000n, 1, 1);
    const e3 = authorizations.authorize(event("E3", "Auth-A", 20000n, 2));
    post("E4", "CREDIT", 40000n, 3, 3);
    const e5 = authorizations.settle(event("E5", "Auth-A", 18500n, 4));
    const beforeE6 = ledger.lastSequence();
    const e6 = authorizations.settle(event("E6", "Auth-Z", 18000n, 4));
    const afterE6 = ledger.lastSequence();
    post("E7", "DEBIT", 62000n, 5, 2);
    const e8 = authorizations.authorize(event("E8", "Auth-B", 9000n, 5));

    // End of Day 5, before any fee: the last event before E9 is E8.
    const endOfDay5PreFee = ledger.lastSequence();

    // HC-16: 1,200.00 - 950.00 = 250.00; 250.00 - 200.00 = 50.00 >= 0
    assert.equal(e3.outcome, "APPROVED");

    // Criterion 3 (HC-10): Auth-A settlement accepted
    assert.equal(e5.outcome, "SETTLED");

    // Criterion 4 (HC-10): Auth-Z rejected, no funds leave the account
    assert.equal(e6.outcome, "REJECTED");
    assert.equal(afterE6, beforeE6);

    // HC-9: -155.00 - 90.00 = -245.00 < 0
    assert.equal(e8.outcome, "REJECTED");

    // Auth-B is never settled inside the window
    assert.equal(authorizations.lookup("Auth-B")?.outcome, "REJECTED");

    // HC-16: ACC-001 closing balance by value day after E8
    const days: readonly Day[] = [1, 2, 3, 4, 5, 6];
    assert.deepEqual(
        days.map((day) => ledger.balanceByValueDay("ACC-001", day).minorUnits),
        [25000n, -37000n, 3000n, -15500n, -15500n, -15500n],
    );

    // Criterion 1 re-check (HC-19): 1,200.00 - 950.00 - 620.00 = -370.00
    assert.deepEqual(
        ledger.balanceAsKnownAt("ACC-001", 2, endOfDay5PreFee),
        money(-37000n, "AED"),
    );
});