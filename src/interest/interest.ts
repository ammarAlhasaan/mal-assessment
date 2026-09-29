import type {Money} from "../money/money.ts";
import type {Ledger} from "../ledger/ledger.ts";

export function dailyInterestAccruals(ledger: Ledger, accountId: string): readonly Money[] {
    throw new Error("Not implemented");
}