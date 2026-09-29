import {test} from "node:test";
import assert from "node:assert/strict";
import {replay} from "../../src/replay/replay.ts";
import type {ReplayEvent} from "../../src/replay/types.ts";
import type {Day, EntryDirection} from "../../src/ledger/types.ts";
import {money} from "../../src/money/money.ts";

const ACC_001 = [{id: "ACC-001", currency: "AED"}] as const;

function posting(eventId: string, direction: EntryDirection, minorUnits: bigint, eventDay: Day, valueDay: Day): ReplayEvent {
    return {type: "POSTING", eventId, accountId: "ACC-001", direction, amount: money(minorUnits, "AED"), eventDay, valueDay};
}

function authorizationEvent(type: "AUTHORIZATION" | "SETTLEMENT", eventId: string, authorizationId: string, minorUnits: bigint, day: Day): ReplayEvent {
    return {type, eventId, authorizationId, accountId: "ACC-001", amount: money(minorUnits, "AED"), eventDay: day, valueDay: day};
}

// [Approved decision: Spec 3 HC-17] Daily close at each day rollover; one close per Day 1–6
test("closes each day before the first event of a later day", () => {
    const {closes} = replay(ACC_001, [
        posting("A", "CREDIT", 10000n, 1, 1),
        posting("B", "DEBIT", 15000n, 1, 1),
        posting("C", "CREDIT", 20000n, 2, 2),
    ]);

    // Day 1: 100.00 - 150.00 = -50.00, charged at the Day 1 close
    assert.deepEqual(closes.map((close) => [close.day, close.events.map((event) => event.eventId), close.fees.map((fee) => fee.eventId)]), [
        [1, ["A", "B"], ["FEE-ACC-001-D1"]],
        [2, ["C"], []],
        [3, [], []],
        [4, [], []],
        [5, [], []],
        [6, [], []],
    ]);
});

// [Approved decision: Spec 3 HC-17, HC-3] A late event joins the open day; a closed day is not reopened
test("processes a late event in the open day", () => {
    const {closes} = replay(ACC_001, [
        posting("A", "CREDIT", 10000n, 1, 1),
        posting("B", "CREDIT", 20000n, 2, 2),
        posting("C", "DEBIT", 15000n, 1, 1),
    ]);

    assert.deepEqual(closes[0]?.events.map((event) => event.eventId), ["A"]);
    assert.deepEqual(closes[0]?.fees, []);
    assert.deepEqual(closes[1]?.events.map((event) => event.eventId), ["B", "C"]);
    // Value day 1: 100.00 - 150.00 = -50.00, charged at the Day 2 close
    assert.deepEqual(closes[1]?.fees.map((fee) => [fee.eventId, fee.eventDay, fee.valueDay]), [["FEE-ACC-001-D1", 2, 1]]);
});

// [Assessment: E6; Approved decision: HC-5] A rejected settlement is an error; replay continues
test("records a rejected settlement as an error and continues", () => {
    const {ledger, closes} = replay(ACC_001, [
        authorizationEvent("SETTLEMENT", "S", "Auth-Z", 5000n, 1),
        posting("A", "CREDIT", 10000n, 1, 1),
    ]);

    assert.deepEqual(closes[0]?.errors.map((error) => [error.eventId, error.outcome]), [["S", "REJECTED"]]);
    assert.deepEqual(ledger.entries().map((entry) => entry.eventId), ["A", "INT-ACC-001"]);
});

// [Approved decision: HC-7] Authorization states are the latest record at each close
test("captures authorization states at each close", () => {
    const {closes} = replay(ACC_001, [
        posting("A", "CREDIT", 10000n, 1, 1),
        authorizationEvent("AUTHORIZATION", "H", "Auth-X", 6000n, 1),
        authorizationEvent("SETTLEMENT", "S", "Auth-X", 6000n, 2),
    ]);

    // Day 1: 100.00 - 60.00 = 40.00 >= 0
    assert.deepEqual(closes.map((close) => close.authorizations.map((record) => [record.authorizationId, record.outcome])), [
        [["Auth-X", "APPROVED"]],
        [["Auth-X", "SETTLED"]],
        [["Auth-X", "SETTLED"]],
        [["Auth-X", "SETTLED"]],
        [["Auth-X", "SETTLED"]],
        [["Auth-X", "SETTLED"]],
    ]);
});

// [Approved decision: Spec 3 HC-17, HC-8] Instalments split in replay; final close capitalizes interest
test("splits instalments and capitalizes interest at the final close", () => {
    const {ledger, closes} = replay([{id: "ACC-002", currency: "BHD"}], [
        {type: "POSTING", eventId: "E", accountId: "ACC-002", direction: "CREDIT", amount: money(10000n, "BHD"), instalments: 3, eventDay: 5, valueDay: 5},
    ]);

    // Days 5 and 6: 10000 x 4 / 10000 = 4 minor units each
    assert.deepEqual(ledger.entries().map((entry) => [entry.eventId, entry.amount.minorUnits]), [
        ["E", 3334n],
        ["E", 3333n],
        ["E", 3333n],
        ["INT-ACC-002", 8n],
    ]);
    assert.deepEqual(closes[5]?.interest.map((entry) => entry.eventId), ["INT-ACC-002"]);
});