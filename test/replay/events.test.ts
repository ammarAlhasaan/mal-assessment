import {test} from "node:test";
import assert from "node:assert/strict";
import {ASSESSMENT_ACCOUNTS, ASSESSMENT_EVENTS} from "../../src/replay/events.ts";
import {money} from "../../src/money/money.ts";

// [Assessment] Accounts: ACC-001 AED, ACC-002 BHD, both opening at zero
test("defines the assessment accounts", () => {
    assert.deepEqual(ASSESSMENT_ACCOUNTS, [
        {id: "ACC-001", currency: "AED"},
        {id: "ACC-002", currency: "BHD"},
    ]);
});

// [Assessment] "Event stream, replayed in this order"
// [Approved decision: HC-8] E10 is one BHD 10.000 event with three instalments, last after E9
test("defines E1–E10 in the written replay order", () => {
    assert.deepEqual(ASSESSMENT_EVENTS, [
        {
            type: "POSTING",
            eventId: "E1",
            accountId: "ACC-001",
            direction: "CREDIT",
            amount: money(120000n, "AED"),
            eventDay: 1,
            valueDay: 1
        },
        {
            type: "POSTING",
            eventId: "E2",
            accountId: "ACC-001",
            direction: "DEBIT",
            amount: money(95000n, "AED"),
            eventDay: 1,
            valueDay: 1
        },
        {
            type: "AUTHORIZATION",
            eventId: "E3",
            authorizationId: "Auth-A",
            accountId: "ACC-001",
            amount: money(20000n, "AED"),
            eventDay: 2,
            valueDay: 2
        },
        {
            type: "POSTING",
            eventId: "E4",
            accountId: "ACC-001",
            direction: "CREDIT",
            amount: money(40000n, "AED"),
            eventDay: 3,
            valueDay: 3
        },
        {
            type: "SETTLEMENT",
            eventId: "E5",
            authorizationId: "Auth-A",
            accountId: "ACC-001",
            amount: money(18500n, "AED"),
            eventDay: 4,
            valueDay: 4
        },
        {
            type: "SETTLEMENT",
            eventId: "E6",
            authorizationId: "Auth-Z",
            accountId: "ACC-001",
            amount: money(18000n, "AED"),
            eventDay: 4,
            valueDay: 4
        },
        {
            type: "POSTING",
            eventId: "E7",
            accountId: "ACC-001",
            direction: "DEBIT",
            amount: money(62000n, "AED"),
            eventDay: 5,
            valueDay: 2
        },
        {
            type: "AUTHORIZATION",
            eventId: "E8",
            authorizationId: "Auth-B",
            accountId: "ACC-001",
            amount: money(9000n, "AED"),
            eventDay: 5,
            valueDay: 5
        },
        {type: "REVERSAL", eventId: "E9", targetEventId: "E7", eventDay: 6, valueDay: 2},
        {
            type: "POSTING",
            eventId: "E10",
            accountId: "ACC-002",
            direction: "CREDIT",
            amount: money(10000n, "BHD"),
            instalments: 3,
            eventDay: 5,
            valueDay: 5
        },
    ]);
});