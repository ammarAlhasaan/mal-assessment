import {test} from "node:test";
import assert from "node:assert/strict";
import {buildReport} from "../../src/report/report.ts";
import {replay} from "../../src/replay/replay.ts";
import type {ReplayEvent} from "../../src/replay/types.ts";
import type {Account} from "../../src/ledger/ledger.ts";
import {money} from "../../src/money/money.ts";

const accounts: readonly Account[] = [
    {id: "ACC-001", currency: "AED"},
    {id: "ACC-002", currency: "BHD"},
];

const events: readonly ReplayEvent[] = [
    {type: "POSTING", eventId: "A", accountId: "ACC-001", direction: "CREDIT", amount: money(10000n, "AED"), eventDay: 1, valueDay: 1},
    {type: "POSTING", eventId: "D", accountId: "ACC-002", direction: "CREDIT", amount: money(2000n, "BHD"), eventDay: 1, valueDay: 1},
    {type: "POSTING", eventId: "B", accountId: "ACC-001", direction: "CREDIT", amount: money(5000n, "AED"), eventDay: 2, valueDay: 2},
    // Late: arrives in Day 2 with event day 1 and value day 1
    {type: "POSTING", eventId: "C", accountId: "ACC-001", direction: "DEBIT", amount: money(3000n, "AED"), eventDay: 1, valueDay: 1},
];

function minorUnits(rows: readonly {readonly balances: readonly {readonly balance: {readonly minorUnits: bigint}}[]}[]) {
    return rows.map((row) => row.balances.map(({balance}) => balance.minorUnits));
}

// [Assessment: per day closing ledger balance; Approved decision: HC-1, HC-4]
test("reports balances as known at each close and final value-dated balances", () => {
    const report = buildReport(accounts, replay(accounts, events));

    // ACC-001 interest: 70.00 -> 2.8 -> 3; 120.00 -> 4.8 -> 5 (x5); 3 + 25 = 28
    // ACC-002 interest: 2.000 -> 0.8 -> 1 (x6) = 6
    assert.deepEqual(minorUnits(report.days), [
        [10000n, 2000n],
        [12000n, 2000n],
        [12000n, 2000n],
        [12000n, 2000n],
        [12000n, 2000n],
        [12028n, 2006n],
    ]);
    // Value day 1 restated by the late debit C: 100.00 - 30.00 = 70.00
    assert.deepEqual(minorUnits(report.finalBalances), [
        [7000n, 2000n],
        [12000n, 2000n],
        [12000n, 2000n],
        [12000n, 2000n],
        [12000n, 2000n],
        [12028n, 2006n],
    ]);
    assert.deepEqual(report.days.map((day) => day.balances.map(({accountId}) => accountId)), Array(6).fill(["ACC-001", "ACC-002"]));
});

// [Approved decision: HC-2] Events, fees, interest, authorizations, and errors stay with their close
test("keeps each close's items on its day", () => {
    const result = replay(accounts, events);
    const report = buildReport(accounts, result);

    assert.deepEqual(
        report.days.map(({balances, ...day}) => day),
        result.closes.map(({boundary, ...close}) => close),
    );
});
