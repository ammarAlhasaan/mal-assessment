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

  const knownAccountIds = new Set(
      accounts.map((account) => account.id),
  );

  return {
    append(request) {
      if (!knownAccountIds.has(request.accountId)) {
        throw new UnknownAccountError(
            `Unknown account: ${request.accountId}`,
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