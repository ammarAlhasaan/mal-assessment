import type { Account, Ledger, LedgerEntry } from "./types.ts";

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


  return {
    append(request) {

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

      const entry: LedgerEntry = Object.freeze({
        ...request,
        amount: Object.freeze({
          ...request.amount,
        }),
        sequence: nextSequence,
      });

      storedEntries.push(entry);
      nextSequence += 1;

      return entry;
    },

    entries(accountId) {
      if (accountId === undefined) {
        return [...storedEntries];
      }

      return storedEntries.filter(
          (entry) => entry.accountId === accountId,
      );
    },
  };
}





export type {
  Account,
  Ledger,
  LedgerEntry,
  PostingRequest,
} from "./types.ts";