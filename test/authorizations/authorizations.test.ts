import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {CurrencyMismatchError, money} from "../../src/money/money.ts";

import {availableBalance, createAuthorizations} from "../../src/authorizations/authorizations.ts";
import type {AuthorizationRequest} from "../../src/authorizations/types.ts";
import {createLedger, InvalidAmountError} from "../../src/ledger/ledger.ts";
import type {Ledger} from "../../src/ledger/ledger.ts";

describe("available balance", () => {
    test("with no active holds it equals the ledger balance", () => {
        assert.deepEqual(
            availableBalance(money(50000n, "AED"), []),
            money(50000n, "AED"),
        );
    });

    test("subtracts one active hold from the ledger balance", () => {
        assert.deepEqual(
            availableBalance(money(50000n, "AED"), [money(12000n, "AED")]),
            money(38000n, "AED"),
        );
    });

    test("subtracts the sum of several active holds", () => {
        // 50000 - (10000 + 2550 + 7525) = 50000 - 20075 = 29925
        assert.deepEqual(
            availableBalance(money(50000n, "AED"), [
                money(10000n, "AED"),
                money(2550n, "AED"),
                money(7525n, "AED"),
            ]),
            money(29925n, "AED"),
        );
    });

    test("is negative, not clamped, when holds exceed the ledger balance", () => {
        // 10000 - (7500 + 5000) = -2500
        assert.deepEqual(
            availableBalance(money(10000n, "AED"), [
                money(7500n, "AED"),
                money(5000n, "AED"),
            ]),
            money(-2500n, "AED"),
        );
    });

    test("is exactly zero when holds equal the ledger balance", () => {
        // 20000 - (15000 + 5000) = 0
        assert.deepEqual(
            availableBalance(money(20000n, "AED"), [
                money(15000n, "AED"),
                money(5000n, "AED"),
            ]),
            money(0n, "AED"),
        );
    });

    test("stays negative when the ledger balance is negative and there are no holds", () => {
        assert.deepEqual(
            availableBalance(money(-4200n, "AED"), []),
            money(-4200n, "AED"),
        );
    });

    test("keeps the ledger balance currency and precision for BHD", () => {
        // 10000 - (3334 + 1) = 6665
        assert.deepEqual(
            availableBalance(money(10000n, "BHD"), [
                money(3334n, "BHD"),
                money(1n, "BHD"),
            ]),
            money(6665n, "BHD"),
        );
    });

    test("rejects a hold in a different currency with CurrencyMismatchError", () => {
        assert.throws(
            () =>
                availableBalance(money(50000n, "AED"), [
                    money(1000n, "AED"),
                    money(1000n, "BHD"),
                ]),
            CurrencyMismatchError,
        );
    });

    test("does not change its inputs or the order and content of the holds", () => {
        const ledgerBalance = money(50000n, "AED");
        const activeHolds = [money(12000n, "AED"), money(3000n, "AED")];

        availableBalance(ledgerBalance, activeHolds);

        assert.deepEqual(ledgerBalance, money(50000n, "AED"));
        assert.deepEqual(activeHolds, [
            money(12000n, "AED"),
            money(3000n, "AED"),
        ]);
    });
});


function setup() {
    const ledger = createLedger([{id: "ACC-1", currency: "AED"}]);
    return {ledger, authorizations: createAuthorizations(ledger)};
}

function credit(ledger: Ledger, minorUnits: bigint) {
    ledger.append({
        eventId: "CREDIT",
        accountId: "ACC-1",
        direction: "CREDIT",
        amount: money(minorUnits, "AED"),
        eventDay: 1,
        valueDay: 1,
    });
}

function request(authorizationId: string, minorUnits: bigint): AuthorizationRequest {
    return {
        eventId: "EV-1",
        authorizationId,
        accountId: "ACC-1",
        amount: money(minorUnits, "AED"),
        eventDay: 1,
        valueDay: 1,
    };
}

describe("authorize", () => {
    test("approves when available balance stays above zero after the hold", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);

        const record = authorizations.authorize(request("AUTH-1", 20000n));

        assert.deepEqual(record, {
            eventId: "EV-1",
            authorizationId: "AUTH-1",
            accountId: "ACC-1",
            amount: money(20000n, "AED"),
            eventDay: 1,
            valueDay: 1,
            outcome: "APPROVED",
        });
        assert.ok(Object.isFrozen(record));
    });

    test("approves when available balance is exactly zero after the hold", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);

        assert.equal(authorizations.authorize(request("AUTH-1", 50000n)).outcome, "APPROVED");
    });

    test("rejects when available balance would go below zero", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);

        assert.equal(authorizations.authorize(request("AUTH-1", 50001n)).outcome, "REJECTED");
    });

    test("approved holds reduce later requests; rejected ones do not", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);

        // 50000 - 30000 = 20000; 20000 - 25000 < 0 (no hold); 20000 - 20000 = 0
        const outcomes = [
            request("A", 30000n),
            request("B", 25000n),
            request("C", 20000n),
        ].map((r) => authorizations.authorize(r).outcome);

        assert.deepEqual(outcomes, ["APPROVED", "REJECTED", "APPROVED"]);
    });

    test("throws InvalidAmountError for a zero or negative hold amount", () => {
        // [Assessment] a non-positive hold would raise available balance instead of reducing it
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);

        assert.throws(() => authorizations.authorize(request("A", 0n)), InvalidAmountError);
        assert.throws(() => authorizations.authorize(request("B", -5000n)), InvalidAmountError);
        assert.equal(authorizations.lookup("B"), undefined);
    });

    test("appends no ledger entry and leaves the ledger balance unchanged", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);

        authorizations.authorize(request("A", 20000n));
        authorizations.authorize(request("B", 90000n));

        assert.equal(ledger.lastSequence(), 1);
        assert.deepEqual(ledger.balanceByValueDay("ACC-1", 1), money(50000n, "AED"));
    });
});


describe("lookup", () => {
    test("finds an approved authorization with outcome APPROVED", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);
        authorizations.authorize(request("AUTH-1", 20000n));

        assert.equal(authorizations.lookup("AUTH-1")?.outcome, "APPROVED");
    });

    test("finds a rejected authorization with outcome REJECTED", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);
        authorizations.authorize(request("AUTH-1", 50001n));

        assert.equal(authorizations.lookup("AUTH-1")?.outcome, "REJECTED");
    });

    test("returns undefined for an id with no authorization", () => {
        const {authorizations} = setup();

        assert.equal(authorizations.lookup("AUTH-Z"), undefined);
    });
});

describe("settle", () => {
    test("an accepted settlement appends exactly one DEBIT with the settlement's fields", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);
        authorizations.authorize(request("AUTH-1", 20000n));

        const record = authorizations.settle({...request("AUTH-1", 18500n), eventId: "SETTLE-1"});

        assert.equal(record.outcome, "SETTLED");
        assert.equal(ledger.lastSequence(), 2);
        assert.deepEqual(ledger.entries().at(-1), {
            eventId: "SETTLE-1",
            accountId: "ACC-1",
            direction: "DEBIT",
            amount: money(18500n, "AED"),
            eventDay: 1,
            valueDay: 1,
            sequence: 2,
        });
    });

    test("a settlement smaller than its hold closes the whole hold", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);
        authorizations.authorize(request("A", 20000n));

        authorizations.settle(request("A", 18500n));

        // ledger 50000 - 18500 = 31500; no hold left, so 31500 - 31500 = 0
        assert.equal(authorizations.lookup("A")?.outcome, "SETTLED");
        assert.equal(authorizations.authorize(request("B", 31500n)).outcome, "APPROVED");
    });

    test("rejects a settlement for an unknown authorization without moving funds", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);

        const record = authorizations.settle(request("AUTH-Z", 18000n));

        assert.equal(record.outcome, "REJECTED");
        assert.equal(ledger.lastSequence(), 1);
        assert.deepEqual(ledger.balanceByValueDay("ACC-1", 1), money(50000n, "AED"));
        assert.equal(authorizations.lookup("AUTH-Z"), undefined);
    });

    test("rejects settling a rejected authorization without moving funds", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);
        authorizations.authorize(request("A", 50001n));

        assert.equal(authorizations.settle(request("A", 10000n)).outcome, "REJECTED");
        assert.equal(ledger.lastSequence(), 1);
        assert.equal(authorizations.lookup("A")?.outcome, "REJECTED");
    });

    test("rejects settling an already-settled authorization without moving funds", () => {
        const {ledger, authorizations} = setup();
        credit(ledger, 50000n);
        authorizations.authorize(request("A", 20000n));
        authorizations.settle(request("A", 18500n));

        assert.equal(authorizations.settle(request("A", 18500n)).outcome, "REJECTED");
        assert.equal(ledger.lastSequence(), 2);
        assert.deepEqual(ledger.balanceByValueDay("ACC-1", 1), money(31500n, "AED"));
    });

    test("rejects a settlement from a different account without moving funds", () => {
        // [Assessment] funds must not leave an account that did not hold the authorization
        const ledger = createLedger([{id: "ACC-1", currency: "AED"}, {id: "ACC-2", currency: "AED"}]);
        const authorizations = createAuthorizations(ledger);
        credit(ledger, 50000n);
        authorizations.authorize(request("A", 20000n));

        const record = authorizations.settle({...request("A", 18500n), accountId: "ACC-2"});

        assert.equal(record.outcome, "REJECTED");
        assert.equal(ledger.lastSequence(), 1);
        assert.equal(authorizations.lookup("A")?.outcome, "APPROVED");
    });
});
