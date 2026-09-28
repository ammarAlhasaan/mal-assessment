import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {decimalPlaces, money} from "../../src/money/money.ts";

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