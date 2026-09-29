import {test} from "node:test";
import assert from "node:assert/strict";
import {renderReport} from "../../src/report/render.ts";
import {buildReport} from "../../src/report/report.ts";
import {replay} from "../../src/replay/replay.ts";
import type {ReplayEvent} from "../../src/replay/types.ts";
import type {Account} from "../../src/ledger/ledger.ts";
import {money} from "../../src/money/money.ts";

const accounts: readonly Account[] = [{id: "ACC-001", currency: "AED"}];

const events: readonly ReplayEvent[] = [
    {type: "POSTING", eventId: "A", accountId: "ACC-001", direction: "CREDIT", amount: money(10000n, "AED"), eventDay: 1, valueDay: 1},
    {type: "AUTHORIZATION", eventId: "H", authorizationId: "Auth-X", accountId: "ACC-001", amount: money(6000n, "AED"), eventDay: 1, valueDay: 1},
    {type: "SETTLEMENT", eventId: "S", authorizationId: "Auth-Z", accountId: "ACC-001", amount: money(2000n, "AED"), eventDay: 1, valueDay: 1},
    {type: "POSTING", eventId: "B", accountId: "ACC-001", direction: "DEBIT", amount: money(15000n, "AED"), eventDay: 2, valueDay: 2},
    {type: "POSTING", eventId: "D", accountId: "ACC-001", direction: "CREDIT", amount: money(30000n, "AED"), eventDay: 3, valueDay: 3},
    // Late: arrives in Day 3 with event day 2
    {type: "POSTING", eventId: "L", accountId: "ACC-001", direction: "CREDIT", amount: money(1000n, "AED"), eventDay: 2, valueDay: 3},
];

// [Assessment: prints per day; Approved decision: HC-5, HC-6]
// Day 2: 100.00 - 150.00 - 25.00 fee = -75.00; Day 3: -75.00 + 300.00 + 10.00 = 235.00
// Interest: 4 + 0 + 9 + 9 + 9 + 9 = 40 -> Day 6: 235.00 + 0.40 = 235.40
test("renders the per-day report and the final value-dated balances", () => {
    assert.equal(renderReport(buildReport(accounts, replay(accounts, events))), [
        "Day 1",
        "  Events: A, H, S",
        "  Closing ledger balance:",
        "    ACC-001 AED 100.00",
        "  Fees assessed: none",
        "  Authorizations:",
        "    Auth-X ACC-001 AED 60.00 APPROVED",
        "  Errors:",
        "    S settlement Auth-Z ACC-001 AED 20.00 REJECTED: no active authorization",
        "",
        "Day 2",
        "  Events: B",
        "  Closing ledger balance:",
        "    ACC-001 AED -75.00",
        "  Fees assessed:",
        "    FEE-ACC-001-D2 ACC-001 AED 25.00 value day 2",
        "  Authorizations:",
        "    Auth-X ACC-001 AED 60.00 APPROVED",
        "  Errors: none",
        "",
        "Day 3",
        "  Events: D, L (late: event day 2)",
        "  Closing ledger balance:",
        "    ACC-001 AED 235.00",
        "  Fees assessed: none",
        "  Authorizations:",
        "    Auth-X ACC-001 AED 60.00 APPROVED",
        "  Errors: none",
        "",
        "Day 4",
        "  Events: none",
        "  Closing ledger balance:",
        "    ACC-001 AED 235.00",
        "  Fees assessed: none",
        "  Authorizations:",
        "    Auth-X ACC-001 AED 60.00 APPROVED",
        "  Errors: none",
        "",
        "Day 5",
        "  Events: none",
        "  Closing ledger balance:",
        "    ACC-001 AED 235.00",
        "  Fees assessed: none",
        "  Authorizations:",
        "    Auth-X ACC-001 AED 60.00 APPROVED",
        "  Errors: none",
        "",
        "Day 6",
        "  Events: none",
        "  Closing ledger balance:",
        "    ACC-001 AED 235.40",
        "  Fees assessed: none",
        "  Interest capitalized:",
        "    INT-ACC-001 ACC-001 AED 0.40",
        "  Authorizations:",
        "    Auth-X ACC-001 AED 60.00 APPROVED",
        "  Errors: none",
        "",
        "Final value-dated closing ledger balances",
        "  Day 1: ACC-001 AED 100.00",
        "  Day 2: ACC-001 AED -75.00",
        "  Day 3: ACC-001 AED 235.00",
        "  Day 4: ACC-001 AED 235.00",
        "  Day 5: ACC-001 AED 235.00",
        "  Day 6: ACC-001 AED 235.40",
    ].join("\n"));
});
