import type { Account, Ledger, LedgerEntry } from "./types.ts";

export class UnknownAccountError extends Error {
  override name = "UnknownAccountError";
}

export class AccountCurrencyMismatchError extends Error {
  override name = "AccountCurrencyMismatchError";
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


      const entry: LedgerEntry = {
        ...request,
        sequence: nextSequence,
      };

      storedEntries.push(entry);
      nextSequence += 1;

      return entry;
    },

    entries() {
      return [...storedEntries];
    },
  };
}





export type {
  Account,
  Ledger,
  LedgerEntry,
  PostingRequest,
} from "./types.ts";