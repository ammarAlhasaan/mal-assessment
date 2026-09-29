import {subtract} from "../money/money.ts";
import type {Money} from "../money/money.ts";


export function availableBalance(
    ledgerBalance: Money,
    activeHolds: readonly Money[],
): Money {
    return activeHolds.reduce(
        (available, hold) => subtract(available, hold),
        ledgerBalance,
    );
}