import type {Account} from "../ledger/ledger.ts";
import type {ReplayResult} from "../replay/types.ts";
import type {Report} from "./types.ts";

/** Day balances as known at each close; final balances by value day after the last close. */
export function buildReport(accounts: readonly Account[], result: ReplayResult): Report {
    const {ledger, closes} = result;

    return Object.freeze({
        days: Object.freeze(closes.map(({boundary, ...close}) => Object.freeze({
            ...close,
            balances: Object.freeze(accounts.map((account) => Object.freeze({
                accountId: account.id,
                balance: ledger.balanceAsKnownAt(account.id, close.day, boundary),
            }))),
        }))),
        finalBalances: Object.freeze(closes.map(({day}) => Object.freeze({
            day,
            balances: Object.freeze(accounts.map((account) => Object.freeze({
                accountId: account.id,
                balance: ledger.balanceByValueDay(account.id, day),
            }))),
        }))),
    });
}
