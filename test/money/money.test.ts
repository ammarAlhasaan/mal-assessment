import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {decimalPlaces, money, zero, format, add, CurrencyMismatchError} from "../../src/money/money.ts";

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