import {test} from "node:test";
import assert from "node:assert/strict";
import {
    createLedger,
    UnknownAccountError,
    AccountCurrencyMismatchError,
    InvalidAmountError
} from "../../src/ledger/ledger.ts";
import {money} from "../../src/money/money.ts";

test("a new ledger has no entries", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
        {id: "ACC-002", currency: "BHD"},
    ]);

    assert.deepEqual(ledger.entries(), []);
});

test("appends E1 as the first ledger entry", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    const entry = ledger.append({
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    assert.deepEqual(entry, {
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1,
        sequence: 1,
    });

    assert.deepEqual(ledger.entries(), [entry]);
});

test("rejects an entry for an unknown account", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    assert.throws(
        () =>
            ledger.append({
                eventId: "E1",
                accountId: "ACC-999",
                direction: "CREDIT",
                amount: money(120000n, "AED"),
                eventDay: 1,
                valueDay: 1,
            }),
        UnknownAccountError,
    );

    assert.deepEqual(ledger.entries(), []);
});

test("rejects an entry whose currency differs from the account currency", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    assert.throws(
        () =>
            ledger.append({
                eventId: "E1",
                accountId: "ACC-001",
                direction: "CREDIT",
                amount: money(120000n, "BHD"),
                eventDay: 1,
                valueDay: 1,
            }),
        AccountCurrencyMismatchError,
    );

    assert.deepEqual(ledger.entries(), []);
});

test("rejects zero and negative posting amounts", () => {
    const ledger = createLedger([
        { id: "ACC-001", currency: "AED" },
    ]);

    const request = {
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT" as const,
        eventDay: 1 as const,
        valueDay: 1 as const,
    };

    assert.throws(
        () =>
            ledger.append({
                ...request,
                amount: money(0n, "AED"),
            }),
        InvalidAmountError,
    );

    assert.throws(
        () =>
            ledger.append({
                ...request,
                amount: money(-1n, "AED"),
            }),
        InvalidAmountError,
    );

    assert.deepEqual(ledger.entries(), []);
});

test("stores an immutable ledger entry", () => {
    const ledger = createLedger([
        { id: "ACC-001", currency: "AED" },
    ]);

    const entry = ledger.append({
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    assert.equal(Object.isFrozen(entry), true);
    assert.equal(Object.isFrozen(entry.amount), true);

    assert.throws(() => {
        (entry as { sequence: number }).sequence = 99;
    }, TypeError);

    assert.throws(() => {
        (entry.amount as { minorUnits: bigint }).minorUnits = 1n;
    }, TypeError);

    assert.equal(ledger.entries()[0]?.sequence, 1);
    assert.equal(ledger.entries()[0]?.amount.minorUnits, 120000n);
});

test("returns entries for the requested account only", () => {
    const ledger = createLedger([
        { id: "ACC-001", currency: "AED" },
        { id: "ACC-002", currency: "BHD" },
    ]);

    ledger.append({
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    const e10 = ledger.append({
        eventId: "E10",
        accountId: "ACC-002",
        direction: "CREDIT",
        amount: money(3334n, "BHD"),
        eventDay: 5,
        valueDay: 5,
    });

    assert.deepEqual(ledger.entries("ACC-002"), [e10]);
});


test("reports the latest replay sequence", () => {
    const ledger = createLedger([
        { id: "ACC-001", currency: "AED" },
    ]);

    assert.equal(ledger.lastSequence(), 0);

    ledger.append({
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    assert.equal(ledger.lastSequence(), 1);

    ledger.append({
        eventId: "E2",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(95000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    assert.equal(ledger.lastSequence(), 2);
});