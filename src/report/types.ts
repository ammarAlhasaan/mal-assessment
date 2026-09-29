import type {Day} from "../ledger/ledger.ts";
import type {Money} from "../money/money.ts";
import type {CloseSnapshot} from "../replay/types.ts";

export interface AccountBalance {
    readonly accountId: string;
    readonly balance: Money;
}

export interface DayReport extends Omit<CloseSnapshot, "boundary"> {
    readonly balances: readonly AccountBalance[];
}

export interface FinalBalances {
    readonly day: Day;
    readonly balances: readonly AccountBalance[];
}

export interface Report {
    readonly days: readonly DayReport[];
    readonly finalBalances: readonly FinalBalances[];
}
