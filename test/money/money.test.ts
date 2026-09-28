import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {
    decimalPlaces,
    money,
    zero,
    format,
    add,
    CurrencyMismatchError,
    subtract,
    compare,
    allocateEqually
} from "../../src/money/money.ts";

describe("money adapter: currency precision", () => {
    test("AED uses 2 decimal places", () => {
        assert.equal(decimalPlaces("AED"), 2);
    });

    test("BHD uses 3 decimal places", () => {
        assert.equal(decimalPlaces("BHD"), 3);
    });
});


describe("money adapter: creation from integer minor units", () => {
    test("keeps the exact minor units and currency it was created with", () => {
        assert.deepEqual(money(120000n, "AED"), {
            minorUnits: 120000n,
            currency: "AED",
        });

        assert.deepEqual(money(10000n, "BHD"), {
            minorUnits: 10000n,
            currency: "BHD",
        });
    });
});


describe("money adapter: zero", () => {
    test("zero is zero minor units in the requested currency", () => {
        assert.deepEqual(zero("AED"), {
            minorUnits: 0n,
            currency: "AED",
        });

        assert.deepEqual(zero("BHD"), {
            minorUnits: 0n,
            currency: "BHD",
        });
    });
});


describe("money adapter: formatting", () => {
    test("formats AED with the currency code and exactly 2 decimal places", () => {
        assert.equal(format(money(120000n, "AED")), "AED 1200.00");
    });

    test("formats BHD with the currency code and exactly 3 decimal places", () => {
        assert.equal(format(money(10000n, "BHD")), "BHD 10.000");
    });

    test("formats negative amounts with a leading minus sign", () => {
        assert.equal(format(money(-37000n, "AED")), "AED -370.00");
    });
});


describe("money adapter: same-currency addition", () => {
    test("adds two amounts of the same currency exactly", () => {
        assert.deepEqual(
            add(money(120000n, "AED"), money(40000n, "AED")),
            money(160000n, "AED"),
        );
    });

    test("rejects adding amounts of different currencies with CurrencyMismatchError", () => {
        assert.throws(
            () => add(money(100n, "AED"), money(100n, "BHD")),
            CurrencyMismatchError,
        );
    });
});


describe("money adapter: same-currency subtraction", () => {
    test("subtracts two amounts of the same currency exactly, allowing a negative result", () => {
        assert.deepEqual(
            subtract(money(40000n, "AED"), money(62000n, "AED")),
            money(-22000n, "AED"),
        );
    });

    test("rejects subtracting amounts of different currencies with CurrencyMismatchError", () => {
        assert.throws(
            () => subtract(money(100n, "AED"), money(100n, "BHD")),
            CurrencyMismatchError,
        );
    });
});


describe("money adapter: comparison", () => {
    test("returns -1, 0, or 1 for less, equal, or greater amounts of the same currency", () => {
        const smaller = money(95000n, "AED");
        const larger = money(120000n, "AED");

        assert.equal(compare(smaller, larger), -1);
        assert.equal(compare(larger, larger), 0);
        assert.equal(compare(larger, smaller), 1);
    });

    test("rejects comparing amounts of different currencies with CurrencyMismatchError", () => {
        assert.throws(
            () => compare(money(100n, "AED"), money(100n, "BHD")),
            CurrencyMismatchError,
        );
    });
});


describe("money adapter: equal allocation (E10)", () => {
    test("allocates the E10 total into three parts in the E10 currency", () => {
        const parts = allocateEqually(money(10000n, "BHD"), 3);

        assert.equal(parts.length, 3);
        assert.equal(parts[0]?.currency, "BHD");
        assert.equal(parts[1]?.currency, "BHD");
        assert.equal(parts[2]?.currency, "BHD");
    });

    test("the three E10 parts sum exactly to the E10 total", () => {
        const parts = allocateEqually(money(10000n, "BHD"), 3);
        const total = parts.reduce(
            (sum, part) => sum + part.minorUnits,
            0n,
        );

        assert.equal(total, 10000n);
    });

    test("no two E10 parts differ by more than one minor unit", () => {
        const parts = allocateEqually(money(10000n, "BHD"), 3);
        const amounts = parts.map((part) => part.minorUnits);

        const largest = amounts.reduce((left, right) =>
            left > right ? left : right,
        );
        const smallest = amounts.reduce((left, right) =>
            left < right ? left : right,
        );

        assert.ok(largest - smallest <= 1n);
    });

    test("E10 parts match the approved amounts and remainder order [HC-1]", () => {
        assert.deepEqual(
            allocateEqually(money(10000n, "BHD"), 3),
            [
                money(3334n, "BHD"),
                money(3333n, "BHD"),
                money(3333n, "BHD"),
            ],
        );
    });

    test("acceptance criterion 7: three instalments of BHD 3.334 would not preserve the E10 total [HC-1]", () => {
        const claimedTotal = 3334n * 3n;

        assert.equal(claimedTotal, 10002n);
        assert.notEqual(claimedTotal, 10000n);
    });
});