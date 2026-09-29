import {subtract} from "../money/money.ts";
import type {Money} from "../money/money.ts";
import type {Ledger} from "../ledger/ledger.ts";
import type {Authorizations} from "./types.ts";

export function availableBalance(
    ledgerBalance: Money,
    activeHolds: readonly Money[],
): Money {
    return activeHolds.reduce(
        (available, hold) => subtract(available, hold),
        ledgerBalance,
    );
}

export function createAuthorizations(ledger: Ledger): Authorizations {
    return {
        authorize() {
            throw new Error("Not implemented");
        },
    };
}