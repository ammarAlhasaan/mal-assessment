import type {Account, Ledger, LedgerEntry} from "./types.ts";
import {zero} from "../money/money.ts";

export class UnknownAccountError extends Error {
    override name = "UnknownAccountError";
}

export class AccountCurrencyMismatchError extends Error {
    override name = "AccountCurrencyMismatchError";
}

export class InvalidAmountError extends Error {
    override name = "InvalidAmountError";
}

export function createLedger(
    accounts: readonly Account[],
): Ledger {

    const storedEntries: LedgerEntry[] = [];
    let nextSequence = 1;

    const accountsById = new Map(
        accounts.map((account) => [account.id, account]),
    );

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

        if (request.amount.minorUnits <= 0n) {
            throw new InvalidAmountError(
                "Posting amount must be positive",
            );
        }
    }

    return {
        append(request) {
            validateRequest(request);

            const entry: LedgerEntry = Object.freeze({
                ...request,
                amount: Object.freeze({...request.amount}),
                sequence: nextSequence,
            });

            storedEntries.push(entry);
            nextSequence += 1;

            return entry;
        },
        appendAll(requests) {
            requests.forEach(validateRequest);
            return requests.map((request) => this.append(request));
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
            void valueDay;

            const account = accountsById.get(accountId);

            if (!account) {
                throw new UnknownAccountError(
                    `Unknown account: ${accountId}`,
                );
            }

            return zero(account.currency);
        },

        lastSequence() {
            return nextSequence - 1;
        },

    };
}


export type {
    Account,
    Ledger,
    LedgerEntry,
    PostingRequest,
} from "./types.ts";