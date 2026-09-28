import {test} from "node:test";
import assert from "node:assert/strict";
import {
    createLedger,
    UnknownAccountError,
    AccountCurrencyMismatchError,
    InvalidAmountError,
    InvalidPostingError,
    DuplicateAccountError,
} from "../../src/ledger/ledger.ts";
import type {Day, LedgerEntry, PostingRequest} from "../../src/ledger/ledger.ts";
import {
    allocateEqually,
    money,
} from "../../src/money/money.ts";

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
        {id: "ACC-001", currency: "AED"},
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
        {id: "ACC-001", currency: "AED"},
        {id: "ACC-002", currency: "BHD"},
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
        {id: "ACC-001", currency: "AED"},
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

test("appends all three E10 instalments together in order", () => {
    const ledger = createLedger([
        {id: "ACC-002", currency: "BHD"},
    ]);

    const requests = allocateEqually(
        money(10000n, "BHD"),
        3,
    ).map((amount): PostingRequest => ({
        eventId: "E10",
        accountId: "ACC-002",
        direction: "CREDIT",
        amount,
        eventDay: 5,
        valueDay: 5,
    }));

    const entries = ledger.appendAll(requests);

    assert.deepEqual(
        entries.map((entry) => entry.amount.minorUnits),
        [3334n, 3333n, 3333n],
    );

    assert.deepEqual(
        entries.map((entry) => entry.sequence),
        [1, 2, 3],
    );

    assert.deepEqual(ledger.entries("ACC-002"), entries);
});

test("does not append a partial batch when one request is invalid", () => {
    const ledger = createLedger([
        {id: "ACC-002", currency: "BHD"},
    ]);

    const validRequest: PostingRequest = {
        eventId: "E10",
        accountId: "ACC-002",
        direction: "CREDIT",
        amount: money(3334n, "BHD"),
        eventDay: 5,
        valueDay: 5,
    };

    const invalidRequest: PostingRequest = {
        ...validRequest,
        accountId: "ACC-999",
    };

    assert.throws(
        () => ledger.appendAll([validRequest, invalidRequest]),
        UnknownAccountError,
    );

    assert.deepEqual(ledger.entries(), []);
    assert.equal(ledger.lastSequence(), 0);
});

test("returns zero in the account currency when it has no entries", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
        {id: "ACC-002", currency: "BHD"},
    ]);

    assert.deepEqual(
        ledger.balanceByValueDay("ACC-001", 1),
        money(0n, "AED"),
    );

    assert.deepEqual(
        ledger.balanceByValueDay("ACC-002", 5),
        money(0n, "BHD"),
    );
});


test("calculates the closing balance by value day", () => {
    const ledger = createLedger([
        { id: "ACC-001", currency: "AED" },
    ]);

    ledger.append({
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    ledger.append({
        eventId: "E2",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(95000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    ledger.append({
        eventId: "E4",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(40000n, "AED"),
        eventDay: 3,
        valueDay: 3,
    });

    ledger.append({
        eventId: "E7",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(62000n, "AED"),
        eventDay: 5,
        valueDay: 2,
    });

    assert.deepEqual(
        ledger.balanceByValueDay("ACC-001", 1),
        money(25000n, "AED"),
    );

    assert.deepEqual(
        ledger.balanceByValueDay("ACC-001", 2),
        money(-37000n, "AED"),
    );

    assert.deepEqual(
        ledger.balanceByValueDay("ACC-001", 3),
        money(3000n, "AED"),
    );

});

test("calculates a balance at a replay-sequence boundary", () => {
    const ledger = createLedger([
        { id: "ACC-001", currency: "AED" },
    ]);

    ledger.append({
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    ledger.append({
        eventId: "E2",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(95000n, "AED"),
        eventDay: 1,
        valueDay: 1,
    });

    const beforeE7 = ledger.lastSequence();

    ledger.append({
        eventId: "E7",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(62000n, "AED"),
        eventDay: 5,
        valueDay: 2,
    });

    assert.deepEqual(
        ledger.balanceAsKnownAt("ACC-001", 2, 0),
        money(0n, "AED"),
    );

    assert.deepEqual(
        ledger.balanceAsKnownAt("ACC-001", 2, beforeE7),
        money(25000n, "AED"),
    );

    assert.deepEqual(
        ledger.balanceAsKnownAt(
            "ACC-001",
            2,
            ledger.lastSequence(),
        ),
        money(-37000n, "AED"),
    );
});
const e1: PostingRequest = {
    eventId: "E1",
    accountId: "ACC-001",
    direction: "CREDIT",
    amount: money(120000n, "AED"),
    eventDay: 1,
    valueDay: 1,
};

test("stores E7's event day and value day independently", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    const e7 = ledger.append({
        eventId: "E7",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(62000n, "AED"),
        eventDay: 5,
        valueDay: 2,
    });

    assert.equal(e7.eventDay, 5);
    assert.equal(e7.valueDay, 2);
});

test("changing the list returned by entries() does not change the ledger", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    ledger.append(e1);

    const returned = ledger.entries() as LedgerEntry[];
    returned.length = 0;

    assert.equal(ledger.entries().length, 1);
});

test("changing a request after append does not change the stored entry", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    const request = {...e1, amount: {currency: "AED" as const, minorUnits: 100n}};
    ledger.append(request);

    request.amount.minorUnits = 999n;
    (request as { eventId: string }).eventId = "E99";

    assert.equal(ledger.entries()[0]?.amount.minorUnits, 100n);
    assert.equal(ledger.entries()[0]?.eventId, "E1");
});

test("stores only posting fields, and the ledger assigns the sequence", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    const entry = ledger.append({...e1, sequence: 999, extra: true} as PostingRequest);

    assert.deepEqual(entry, {...e1, sequence: 1});
});

test("a rejected append does not consume a replay sequence", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    assert.throws(
        () => ledger.append({...e1, amount: money(0n, "AED")}),
        InvalidAmountError,
    );
    assert.equal(ledger.lastSequence(), 0);

    assert.equal(ledger.append(e1).sequence, 1);
});

test("rejects an unknown direction and days outside the window", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    const invalid = [
        {...e1, direction: "FOO"},
        {...e1, eventDay: 0},
        {...e1, valueDay: 7},
        {...e1, valueDay: 2.5},
        {...e1, valueDay: "1"},
    ] as unknown as PostingRequest[];

    for (const request of invalid) {
        assert.throws(() => ledger.append(request), InvalidPostingError);
    }

    assert.deepEqual(ledger.entries(), []);
    assert.equal(ledger.lastSequence(), 0);
});

test("rejects minor units that are not a bigint", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    assert.throws(
        () =>
            ledger.append({
                ...e1,
                amount: {currency: "AED", minorUnits: 1.5 as unknown as bigint},
            }),
        InvalidAmountError,
    );

    assert.deepEqual(ledger.entries(), []);
});

test("rejects duplicate account ids", () => {
    assert.throws(
        () =>
            createLedger([
                {id: "ACC-001", currency: "AED"},
                {id: "ACC-001", currency: "BHD"},
            ]),
        DuplicateAccountError,
    );
});

test("balance queries for an unknown account throw UnknownAccountError", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    assert.throws(() => ledger.balanceByValueDay("ACC-999", 1), UnknownAccountError);
    assert.throws(() => ledger.balanceAsKnownAt("ACC-999", 1, 0), UnknownAccountError);
});

test("balance queries reject value days and boundaries outside their range", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    ledger.append(e1);

    for (const day of [0, 7, 2.5]) {
        assert.throws(() => ledger.balanceByValueDay("ACC-001", day as Day), RangeError);
    }

    for (const boundary of [-1, 0.5, Number.NaN, 2]) {
        assert.throws(() => ledger.balanceAsKnownAt("ACC-001", 1, boundary), RangeError);
    }
});

test("appendAll with no requests appends nothing", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    assert.deepEqual(ledger.appendAll([]), []);
    assert.equal(ledger.lastSequence(), 0);
});

test("appendAll works when called without its ledger as this", () => {
    const ledger = createLedger([
        {id: "ACC-001", currency: "AED"},
    ]);

    const {appendAll} = ledger;

    assert.equal(appendAll([e1])[0]?.sequence, 1);
});
