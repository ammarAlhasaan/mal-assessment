import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {applyRate, money} from "../../src/money/money.ts";

// 0.04% = 4 x 10^-4
const DAILY_INTEREST = {amount: 4n, scale: 4n};

describe("rate application", () => {
    // [Assessment] 0.04% of a balance
    test("applies 0.04% exactly", () => {
        // 25000 x 4 / 10000 = 10
        assert.deepEqual(applyRate(money(25000n, "AED"), DAILY_INTEREST), money(10n, "AED"));
    });

    // [Assessment] rounded to the currency's own precision
    test("rounds the result to AED precision", () => {
        // 41500 x 4 / 10000 = 16.6 -> 17
        assert.deepEqual(applyRate(money(41500n, "AED"), DAILY_INTEREST), money(17n, "AED"));
    });

    // [Approved decision: HC-11] round half up
    test("rounds a half minor unit up", () => {
        // 1250 x 4 / 10000 = 0.5 -> 1
        assert.deepEqual(applyRate(money(1250n, "AED"), DAILY_INTEREST), money(1n, "AED"));
    });

    // [Assessment] BHD uses 3 decimal places
    test("keeps BHD at three decimal places", () => {
        // 10000 x 4 / 10000 = 4
        assert.deepEqual(applyRate(money(10000n, "BHD"), DAILY_INTEREST), money(4n, "BHD"));
    });
});