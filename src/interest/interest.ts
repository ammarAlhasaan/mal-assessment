import {add, applyRate, compare, zero} from "../money/money.ts";
import type {Money} from "../money/money.ts";
import type {Day, Ledger, LedgerEntry} from "../ledger/ledger.ts";

const DAILY_INTEREST = {amount: 4n, scale: 4n};
const DAYS: readonly Day[] = [1, 2, 3, 4, 5, 6];

export function dailyInterestAccruals(ledger: Ledger, accountId: string): readonly Money[] {
    return Object.freeze(DAYS.map((day) => {
        const balance = ledger.balanceByValueDay(accountId, day);

        return compare(balance, zero(balance.currency)) > 0
            ? applyRate(balance, DAILY_INTEREST)
            : zero(balance.currency);
    }));
}

export function capitalizeInterest(ledger: Ledger, accountId: string): LedgerEntry {
    const accruals = dailyInterestAccruals(ledger, accountId);
    const total = accruals.reduce(add);

    return ledger.append({
        eventId: `INT-${accountId}`,
        accountId,
        direction: "CREDIT",
        amount: total,
        eventDay: 6,
        valueDay: 6,
    });
}