import type {Account, Day, Ledger, LedgerEntry, PostingRequest, ReplaySequence} from "./types.ts";
import {
    add,
    money,
    subtract,
    zero,
} from "../money/money.ts";
import type {Money} from "../money/money.ts";

export class UnknownAccountError extends Error {
    override name = "UnknownAccountError";
}

export class AccountCurrencyMismatchError extends Error {
    override name = "AccountCurrencyMismatchError";
}

export class InvalidAmountError extends Error {
    override name = "InvalidAmountError";
}

/** Thrown when a posting has an unknown direction or a day outside the window. */
export class InvalidPostingError extends Error {
    override name = "InvalidPostingError";
}

/** Thrown when createLedger receives the same account id more than once. */
export class DuplicateAccountError extends Error {
    override name = "DuplicateAccountError";
}

const FIRST_DAY = 1;
const LAST_DAY = 6;

function isDay(value: unknown): value is Day {
    return Number.isInteger(value) &&
        (value as number) >= FIRST_DAY &&
        (value as number) <= LAST_DAY;
}

export function createLedger(
    accounts: readonly Account[],
): Ledger {

    const storedEntries: LedgerEntry[] = [];
    let nextSequence = 1;

    const accountsById = new Map<string, Account>();

    for (const account of accounts) {
        if (accountsById.has(account.id)) {
            throw new DuplicateAccountError(
                `Duplicate account: ${account.id}`,
            );
        }

        accountsById.set(account.id, {id: account.id, currency: account.currency});
    }

    /** Copies only the posting fields, so later changes by the caller cannot reach the ledger. */
    function snapshot(request: PostingRequest): PostingRequest {
        return {
            eventId: request.eventId,
            accountId: request.accountId,
            direction: request.direction,
            amount: {
                currency: request.amount.currency,
                minorUnits: request.amount.minorUnits,
            },
            eventDay: request.eventDay,
            valueDay: request.valueDay,
        };
    }

    function validateRequest(request: PostingRequest): void {
        const account = accountsById.get(request.accountId);

        if (!account) {
            throw new UnknownAccountError(
                `Unknown account: ${request.accountId}`,
            );
        }

        if (account.currency !== request.amount.currency) {
            throw new AccountCurrencyMismatchError(
                `Account ${account.id} uses ${account.currency}, not ${request.amount.currency}`,
            );
        }

        if (typeof request.amount.minorUnits !== "bigint") {
            throw new InvalidAmountError(
                "Posting amount must be a bigint number of minor units",
            );
        }

        if (request.amount.minorUnits <= 0n) {
            throw new InvalidAmountError(
                "Posting amount must be positive",
            );
        }

        if (request.direction !== "CREDIT" && request.direction !== "DEBIT") {
            throw new InvalidPostingError(
                `Unknown direction: ${String(request.direction)}`,
            );
        }

        if (!isDay(request.eventDay) || !isDay(request.valueDay)) {
            throw new InvalidPostingError(
                `Event day and value day must be integers from ${FIRST_DAY} to ${LAST_DAY}`,
            );
        }
    }

    /** Stores an already validated snapshot and assigns its replay sequence. */
    function store(request: PostingRequest): LedgerEntry {
        const entry: LedgerEntry = Object.freeze({
            ...request,
            amount: money(request.amount.minorUnits, request.amount.currency),
            sequence: nextSequence,
        });

        storedEntries.push(entry);
        nextSequence += 1;

        return entry;
    }

    function requireAccount(accountId: string): Account {
        const account = accountsById.get(accountId);

        if (!account) {
            throw new UnknownAccountError(
                `Unknown account: ${accountId}`,
            );
        }

        return account;
    }

    function closingBalance(
        accountId: string,
        valueDay: Day,
        boundary: ReplaySequence,
    ): Money {
        const account = requireAccount(accountId);

        if (!isDay(valueDay)) {
            throw new RangeError(
                `Value day must be an integer from ${FIRST_DAY} to ${LAST_DAY}`,
            );
        }

        return storedEntries
            .filter(
                (entry) =>
                    entry.accountId === accountId &&
                    entry.valueDay <= valueDay &&
                    entry.sequence <= boundary,
            )
            .reduce(
                (balance, entry) =>
                    entry.direction === "DEBIT"
                        ? subtract(balance, entry.amount)
                        : add(balance, entry.amount),
                zero(account.currency),
            );
    }

    return {
        append(request) {
            const posting = snapshot(request);
            validateRequest(posting);
            return store(posting);
        },
        appendAll(requests) {
            const postings = requests.map(snapshot);
            postings.forEach(validateRequest);
            return Object.freeze(postings.map(store));
        },

        entries(accountId) {
            if (accountId === undefined) {
                return [...storedEntries];
            }

            return storedEntries.filter(
                (entry) => entry.accountId === accountId,
            );
        },
        balanceByValueDay(accountId, valueDay) {
            return closingBalance(accountId, valueDay, nextSequence - 1);
        },
        balanceAsKnownAt(accountId, valueDay, boundary) {
            if (
                !Number.isInteger(boundary) ||
                boundary < 0 ||
                boundary > nextSequence - 1
            ) {
                throw new RangeError(
                    `Boundary must be an integer from 0 to ${nextSequence - 1}, got ${boundary}`,
                );
            }

            return closingBalance(accountId, valueDay, boundary);
        },
        lastSequence() {
            return nextSequence - 1;
        },
    };
}


export type {
    Account,
    Day,
    Ledger,
    LedgerEntry,
    PostingRequest,
    ReplaySequence,
} from "./types.ts";
