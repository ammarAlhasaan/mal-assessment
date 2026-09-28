import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {decimalPlaces} from "../../src/money/money.ts";

describe("money adapter: currency precision", () => {
  test("AED uses 2 decimal places", () => {
    assert.equal(decimalPlaces("AED"), 2);
  });

  test("BHD uses 3 decimal places", () => {
    assert.equal(decimalPlaces("BHD"), 3);
  });
});
