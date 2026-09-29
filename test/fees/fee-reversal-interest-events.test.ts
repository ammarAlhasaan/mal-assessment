import {test} from "node:test";
import assert from "node:assert/strict";
import {createAuthorizations} from "../../src/authorizations/authorizations.ts";
import {assessOverdraftFees} from "../../src/fees/fees.ts";
import {capitalizeInterest, dailyInterestAccruals} from "../../src/interest/interest.ts";
import {createLedger} from "../../src/ledger/ledger.ts";
import type {Day, EntryDirection} from "../../src/ledger/types.ts";
import {allocateEqually, money} from "../../src/money/money.ts";
import {reverse} from "../../src/reversals/reversals.ts";

test("replays E1–E10 with daily fee closes, E9, and Day 6 capitalization", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
        {id: "ACC-002", currency: "BHD"},
    ]);
    const authorizations = createAuthorizations(ledger);
    const days: readonly Day[] = [1, 2, 3, 4, 5, 6];

    function post(eventId: string, direction: EntryDirection, minorUnits: bigint, eventDay: Day, valueDay: Day) {
        ledger.append({eventId, accountId: "ACC-001", direction, amount: money(minorUnits, "AED"), eventDay, valueDay});
    }

    function event(eventId: string, authorizationId: string, minorUnits: bigint, day: Day) {
        return {eventId, authorizationId, accountId: "ACC-001", amount: money(minorUnits, "AED"), eventDay: day, valueDay: day};
    }

    // HC-17: daily close at each day rollover assesses fees
    function close(day: Day) {
        return [...assessOverdraftFees(ledger, "ACC-001", day), ...assessOverdraftFees(ledger, "ACC-002", day)];
    }

    function balances(accountId: string) {
        return days.map((day) => ledger.balanceByValueDay(accountId, day).minorUnits);
    }

    post("E1", "CREDIT", 120000n, 1, 1);
    post("E2", "DEBIT", 95000n, 1, 1);
    const closeDay1 = close(1);
    authorizations.authorize(event("E3", "Auth-A", 20000n, 2));
    const closeDay2 = close(2);
    post("E4", "CREDIT", 40000n, 3, 3);
    const closeDay3 = close(3);
    authorizations.settle(event("E5", "Auth-A", 18500n, 4));
    authorizations.settle(event("E6", "Auth-Z", 18000n, 4));
    const closeDay4 = close(4);
    const preE7 = balances("ACC-001");
    post("E7", "DEBIT", 62000n, 5, 2);
    const e7 = ledger.entries("ACC-001").find((entry) => entry.eventId === "E7");
    authorizations.authorize(event("E8", "Auth-B", 9000n, 5));
    const endOfDay5PreFee = ledger.lastSequence();
    const closeDay5 = close(5);
    const afterDay5Fees = balances("ACC-001");
    reverse(ledger, {eventId: "E9", targetEventId: "E7", eventDay: 6, valueDay: 2});
    ledger.appendAll(allocateEqually(money(10000n, "BHD"), 3).map((amount) => ({
        eventId: "E10", accountId: "ACC-002", direction: "CREDIT" as const, amount, eventDay: 5 as const, valueDay: 5 as const,
    })));

    // HC-17: final window close after the last written event
    const closeDay6 = close(6);
    const afterE9 = balances("ACC-001");
    const acc001Accruals = dailyInterestAccruals(ledger, "ACC-001");
    const acc002Accruals = dailyInterestAccruals(ledger, "ACC-002");
    const acc001Interest = capitalizeInterest(ledger, "ACC-001");
    const acc002Interest = capitalizeInterest(ledger, "ACC-002");

    // Criterion 1 (accepted): 1,200.00 - 950.00 - 620.00 = -370.00, before any fee
    assert.deepEqual(ledger.balanceAsKnownAt("ACC-001", 2, endOfDay5PreFee), money(-37000n, "AED"));

    // HC-15: no fee at the Day 1-4 closes; the Day 5 close charges Days 2, 4, 5
    assert.deepEqual([closeDay1, closeDay2, closeDay3, closeDay4], [[], [], [], []]);
    assert.deepEqual(closeDay5.map((fee) => [fee.eventId, fee.eventDay, fee.valueDay, fee.amount.minorUnits]), [
        ["FEE-ACC-001-D2", 5, 2, 2500n],
        ["FEE-ACC-001-D4", 5, 4, 2500n],
        ["FEE-ACC-001-D5", 5, 5, 2500n],
    ]);
    // Criterion 2 (rejected): E7 causes three fees, not one
    assert.equal(closeDay5.length, 3);
    assert.deepEqual(afterDay5Fees, [25000n, -39500n, 500n, -20500n, -23000n, -23000n]);

    // HC-15: after E9 no day is negative, so the final close charges nothing
    assert.deepEqual(closeDay6, []);
    assert.deepEqual(afterE9, [25000n, 22500n, 62500n, 41500n, 39000n, 39000n]);

    // Criterion 6 (rejected): E7 stays, the three fees stay, balances do not return
    assert.deepEqual(ledger.entries("ACC-001").find((entry) => entry.eventId === "E7"), e7);
    assert.equal(ledger.entries("ACC-001").filter((entry) => entry.eventId.startsWith("FEE-")).length, 3);
    assert.deepEqual(preE7, [25000n, 25000n, 65000n, 46500n, 46500n, 46500n]);
    assert.notDeepEqual(afterE9, preE7);

    // HC-8: Auth-B is not re-evaluated after E9
    assert.equal(authorizations.lookup("Auth-B")?.outcome, "REJECTED");

    // HC-15 interest; criterion 8 (rejected): 10+9+25+17+16+16 = 93, not round(91.8) = 92
    assert.deepEqual(acc001Accruals.map((accrual) => accrual.minorUnits), [10n, 9n, 25n, 17n, 16n, 16n]);
    assert.deepEqual(acc001Interest.amount, money(93n, "AED"));
    assert.deepEqual(acc002Accruals.map((accrual) => accrual.minorUnits), [0n, 0n, 0n, 0n, 4n, 4n]);
    assert.deepEqual(acc002Interest.amount, money(8n, "BHD"));

    // Day 6 closing after capitalization: 390.00 + 0.93; 10.000 + 0.008
    assert.deepEqual(ledger.balanceByValueDay("ACC-001", 6), money(39093n, "AED"));
    assert.deepEqual(ledger.balanceByValueDay("ACC-002", 6), money(10008n, "BHD"));
});