import type {Money} from "../money/money.ts";

/**
 * Available balance: the given ledger balance minus the sum of the given
 * active hold amounts (HC-20). Pure: reads no ledger or authorization history.
 */
export function availableBalance(
    ledgerBalance: Money,
    activeHolds: readonly Money[],
): Money {
    throw new Error("Not implemented");
}