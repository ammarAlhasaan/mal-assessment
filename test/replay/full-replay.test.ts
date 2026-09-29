import {test} from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {ASSESSMENT_ACCOUNTS, ASSESSMENT_EVENTS} from "../../src/replay/events.ts";
import {replay} from "../../src/replay/replay.ts";
import {buildReport} from "../../src/report/report.ts";
import type {Day} from "../../src/ledger/ledger.ts";

const DAYS: readonly Day[] = [1, 2, 3, 4, 5, 6];

// [Assessment: E1–E10, both accounts; Approved decision: HC-1…HC-8, HC-11]
test("replays E1–E10 into the approved per-day result and criteria verdicts", () => {
    const result = replay(ASSESSMENT_ACCOUNTS, ASSESSMENT_EVENTS);
    const {ledger, closes} = result;
    const report = buildReport(ASSESSMENT_ACCOUNTS, result);

    assert.deepEqual(report.days.map((day) => [
        day.day,
        day.balances.map(({balance}) => balance.minorUnits),
        day.fees.map((fee) => fee.eventId),
        day.interest.map((entry) => [entry.eventId, entry.amount.minorUnits]),
        day.authorizations.map((record) => [record.authorizationId, record.outcome]),
        day.errors.map((error) => error.eventId),
    ]), [
        [1, [25000n, 0n], [], [], [], []],
        [2, [25000n, 0n], [], [], [["Auth-A", "APPROVED"]], []],
        [3, [65000n, 0n], [], [], [["Auth-A", "APPROVED"]], []],
        [4, [46500n, 0n], [], [], [["Auth-A", "SETTLED"]], ["E6"]],
        [5, [-23000n, 0n], ["FEE-ACC-001-D2", "FEE-ACC-001-D4", "FEE-ACC-001-D5"], [], [["Auth-A", "SETTLED"], ["Auth-B", "REJECTED"]], []],
        [6, [39093n, 10008n], [], [["INT-ACC-001", 93n], ["INT-ACC-002", 8n]], [["Auth-A", "SETTLED"], ["Auth-B", "REJECTED"]], []],
    ]);
    assert.deepEqual(report.finalBalances.map(({balances}) => balances.map(({balance}) => balance.minorUnits)), [
        [25000n, 0n],
        [22500n, 0n],
        [62500n, 0n],
        [41500n, 0n],
        [39000n, 10000n],
        [39093n, 10008n],
    ]);

    const day4 = closes[3]!;
    const day5 = closes[4]!;

    // Criterion 1 (accepted): before the first fee, 1,200.00 - 950.00 - 620.00 = -370.00
    assert.equal(ledger.balanceAsKnownAt("ACC-001", 2, day5.fees[0]!.sequence - 1).minorUnits, -37000n);

    // Criterion 2 (rejected): E7 causes three fees (Days 2, 4, 5), not one
    assert.equal(day5.fees.length, 3);

    // Criterion 3 (accepted): Auth-A settles on Day 4
    assert.equal(day4.authorizations.find((record) => record.authorizationId === "Auth-A")?.outcome, "SETTLED");

    // Criterion 4 (accepted): Auth-Z is rejected and no funds leave the account
    assert.deepEqual(day4.errors.map((error) => [error.eventId, error.outcome]), [["E6", "REJECTED"]]);
    assert.equal(ledger.entries().some((entry) => entry.eventId === "E6"), false);

    // Criterion 5 (accepted, conditional): Auth-B is rejected; holds never post to the ledger
    assert.equal(day5.authorizations.find((record) => record.authorizationId === "Auth-B")?.outcome, "REJECTED");
    assert.equal(ledger.entries().some((entry) => entry.eventId === "E3" || entry.eventId === "E8"), false);

    // Criterion 6 (rejected): balances do not return to pre-E7 values and the fees remain
    const preE7 = DAYS.map((day) => ledger.balanceAsKnownAt("ACC-001", day, day4.boundary).minorUnits);
    assert.deepEqual(preE7, [25000n, 25000n, 65000n, 46500n, 46500n, 46500n]);
    assert.notDeepEqual(DAYS.map((day) => ledger.balanceByValueDay("ACC-001", day).minorUnits), preE7);
    assert.equal(ledger.entries("ACC-001").filter((entry) => entry.eventId.startsWith("FEE-")).length, 3);

    // Criterion 7 (rejected): 3,334 + 3,333 + 3,333 = 10,000, not 3 x 3,334
    assert.deepEqual(ledger.entries("ACC-002").filter((entry) => entry.eventId === "E10").map((entry) => entry.amount.minorUnits), [3334n, 3333n, 3333n]);

    // Criterion 8 (rejected): 10 + 9 + 25 + 17 + 16 + 16 = 93, not round(91.8) = 92
    assert.equal(ledger.entries("ACC-001").find((entry) => entry.eventId === "INT-ACC-001")?.amount.minorUnits, 93n);
});

// [Assessment: runnable script prints per day; Approved decision: HC-6, HC-9]
test("npm start prints the approved report and exits 0", () => {
    const run = spawnSync(process.execPath, [fileURLToPath(new URL("../../src/run.ts", import.meta.url))], {encoding: "utf8"});

    assert.equal(run.status, 0);
    assert.equal(run.stdout, [
        "Day 1",
        "  Events: E1, E2",
        "  Closing ledger balance:",
        "    ACC-001 AED 250.00",
        "    ACC-002 BHD 0.000",
        "  Fees assessed: none",
        "  Authorizations: none",
        "  Errors: none",
        "",
        "Day 2",
        "  Events: E3",
        "  Closing ledger balance:",
        "    ACC-001 AED 250.00",
        "    ACC-002 BHD 0.000",
        "  Fees assessed: none",
        "  Authorizations:",
        "    Auth-A ACC-001 AED 200.00 APPROVED",
        "  Errors: none",
        "",
        "Day 3",
        "  Events: E4",
        "  Closing ledger balance:",
        "    ACC-001 AED 650.00",
        "    ACC-002 BHD 0.000",
        "  Fees assessed: none",
        "  Authorizations:",
        "    Auth-A ACC-001 AED 200.00 APPROVED",
        "  Errors: none",
        "",
        "Day 4",
        "  Events: E5, E6",
        "  Closing ledger balance:",
        "    ACC-001 AED 465.00",
        "    ACC-002 BHD 0.000",
        "  Fees assessed: none",
        "  Authorizations:",
        "    Auth-A ACC-001 AED 185.00 SETTLED",
        "  Errors:",
        "    E6 settlement Auth-Z ACC-001 AED 180.00 REJECTED: no active authorization",
        "",
        "Day 5",
        "  Events: E7, E8",
        "  Closing ledger balance:",
        "    ACC-001 AED -230.00",
        "    ACC-002 BHD 0.000",
        "  Fees assessed:",
        "    FEE-ACC-001-D2 ACC-001 AED 25.00 value day 2",
        "    FEE-ACC-001-D4 ACC-001 AED 25.00 value day 4",
        "    FEE-ACC-001-D5 ACC-001 AED 25.00 value day 5",
        "  Authorizations:",
        "    Auth-A ACC-001 AED 185.00 SETTLED",
        "    Auth-B ACC-001 AED 90.00 REJECTED",
        "  Errors: none",
        "",
        "Day 6",
        "  Events: E9, E10 (late: event day 5)",
        "  Closing ledger balance:",
        "    ACC-001 AED 390.93",
        "    ACC-002 BHD 10.008",
        "  Fees assessed: none",
        "  Interest capitalized:",
        "    INT-ACC-001 ACC-001 AED 0.93",
        "    INT-ACC-002 ACC-002 BHD 0.008",
        "  Authorizations:",
        "    Auth-A ACC-001 AED 185.00 SETTLED",
        "    Auth-B ACC-001 AED 90.00 REJECTED",
        "  Errors: none",
        "",
        "Final value-dated closing ledger balances",
        "  Day 1: ACC-001 AED 250.00, ACC-002 BHD 0.000",
        "  Day 2: ACC-001 AED 225.00, ACC-002 BHD 0.000",
        "  Day 3: ACC-001 AED 625.00, ACC-002 BHD 0.000",
        "  Day 4: ACC-001 AED 415.00, ACC-002 BHD 0.000",
        "  Day 5: ACC-001 AED 390.00, ACC-002 BHD 10.000",
        "  Day 6: ACC-001 AED 390.93, ACC-002 BHD 10.008",
    ].join("\n") + "\n");
});
