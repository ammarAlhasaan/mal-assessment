import {createAuthorizations} from "../authorizations/authorizations.ts";
import type {AuthorizationRecord, SettlementRecord} from "../authorizations/types.ts";
import {assessOverdraftFees} from "../fees/fees.ts";
import {capitalizeInterest} from "../interest/interest.ts";
import {createLedger} from "../ledger/ledger.ts";
import type {Account, Day} from "../ledger/ledger.ts";
import {allocateEqually} from "../money/money.ts";
import {reverse} from "../reversals/reversals.ts";
import type {CloseSnapshot, ReplayEvent, ReplayResult} from "./types.ts";

const FINAL_DAY: Day = 6;

/** Replays events in written order with a daily close at each day rollover and a final close after the last event. */
export function replay(accounts: readonly Account[], events: readonly ReplayEvent[]): ReplayResult {
    const ledger = createLedger(accounts);
    const authorizations = createAuthorizations(ledger);
    const authorizationIds: string[] = [];
    const closes: CloseSnapshot[] = [];
    let openDay: Day = 1;
    let dayEvents: ReplayEvent[] = [];
    let errors: SettlementRecord[] = [];

    function close(day: Day) {
        const fees = accounts.flatMap((account) => assessOverdraftFees(ledger, account.id, day));
        const interest = day === FINAL_DAY
            ? accounts.map((account) => capitalizeInterest(ledger, account.id))
            : [];

        closes.push(Object.freeze({
            day,
            events: Object.freeze(dayEvents),
            boundary: ledger.lastSequence(),
            fees: Object.freeze(fees),
            interest: Object.freeze(interest),
            authorizations: Object.freeze(authorizationIds.map(
                (id) => authorizations.lookup(id) as AuthorizationRecord | SettlementRecord,
            )),
            errors: Object.freeze(errors),
        }));
        dayEvents = [];
        errors = [];
    }

    function closeUntil(day: Day) {
        while (openDay < day) {
            close(openDay);
            openDay = (openDay + 1) as Day;
        }
    }

    for (const event of events) {
        closeUntil(event.eventDay);
        dayEvents.push(event);

        if (event.type === "POSTING") {
            if (event.instalments === undefined) {
                ledger.append(event);
            } else {
                ledger.appendAll(allocateEqually(event.amount, event.instalments).map((amount) => ({...event, amount})));
            }
        } else if (event.type === "AUTHORIZATION") {
            authorizations.authorize(event);
            if (!authorizationIds.includes(event.authorizationId)) {
                authorizationIds.push(event.authorizationId);
            }
        } else if (event.type === "SETTLEMENT") {
            const settlement = authorizations.settle(event);
            if (settlement.outcome === "REJECTED") {
                errors.push(settlement);
            }
        } else {
            reverse(ledger, event);
        }
    }

    closeUntil(FINAL_DAY);
    close(FINAL_DAY);

    return Object.freeze({ledger, closes: Object.freeze(closes)});
}