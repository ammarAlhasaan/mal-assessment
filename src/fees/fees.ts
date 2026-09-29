import {compare, money, zero} from "../money/money.ts";
import type {Day, Ledger, LedgerEntry} from "../ledger/ledger.ts";

const OVERDRAFT_FEE = money(2500n, "AED");
const DAYS: readonly Day[] = [1, 2, 3, 4, 5, 6];

/** Charges each uncharged negative value day from Day 1 to assessmentDay, in ascending order. */
export function assessOverdraftFees(
    ledger: Ledger,
    accountId: string,
    assessmentDay: Day,
): readonly LedgerEntry[] {
    const fees: LedgerEntry[] = [];

    for (const day of DAYS.filter((valueDay) => valueDay <= assessmentDay)) {
        const eventId = `FEE-${accountId}-D${day}`;
        const charged = ledger.entries(accountId).some((entry) => entry.eventId === eventId);
        const balance = ledger.balanceByValueDay(accountId, day);

        if (!charged && compare(balance, zero(balance.currency)) < 0) {
            fees.push(ledger.append({
                eventId,
                accountId,
                direction: "DEBIT",
                amount: OVERDRAFT_FEE,
                eventDay: assessmentDay,
                valueDay: day,
            }));
        }
    }

    return Object.freeze(fees);
}