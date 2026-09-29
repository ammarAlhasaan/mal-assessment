import type {Ledger, LedgerEntry} from "../ledger/ledger.ts";
import type {ReversalRequest} from "./types.ts";


export class InvalidReversalTargetError extends Error {
    override name = "InvalidReversalTargetError";
}

export function reverse(ledger: Ledger, request: ReversalRequest): LedgerEntry {
    const targets = ledger.entries().filter((entry) => entry.eventId === request.targetEventId);
    const target = targets[0];

    if (targets.length !== 1 || target === undefined) {
        throw new InvalidReversalTargetError(
            `Reversal target must match exactly one entry: ${request.targetEventId}`,
        );
    }

    return ledger.append({
        eventId: request.eventId,
        accountId: target.accountId,
        direction: target.direction === "DEBIT" ? "CREDIT" : "DEBIT",
        amount: target.amount,
        eventDay: request.eventDay,
        valueDay: request.valueDay,
    });
}