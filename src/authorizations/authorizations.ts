import {compare, money, subtract, zero} from "../money/money.ts";
import type {Money} from "../money/money.ts";
import type {Ledger} from "../ledger/ledger.ts";
import type {AuthorizationOutcome, AuthorizationRecord, Authorizations} from "./types.ts";


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
    const records: AuthorizationRecord[] = [];

    return {
        authorize(request) {
            const ledgerBalance = ledger.balanceByValueDay(request.accountId, request.valueDay);
            const activeHolds = records
                .filter((record) => record.accountId === request.accountId && record.outcome === "APPROVED")
                .map((record) => record.amount);
            const afterHold = availableBalance(ledgerBalance, [...activeHolds, request.amount]);
            const outcome: AuthorizationOutcome =
                compare(afterHold, zero(afterHold.currency)) >= 0 ? "APPROVED" : "REJECTED";

            const record: AuthorizationRecord = Object.freeze({
                eventId: request.eventId,
                authorizationId: request.authorizationId,
                accountId: request.accountId,
                amount: money(request.amount.minorUnits, request.amount.currency),
                eventDay: request.eventDay,
                valueDay: request.valueDay,
                outcome,
            });

            records.push(record);
            return record;
        },
    };
}