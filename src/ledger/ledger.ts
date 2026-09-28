import type { Account, Ledger, LedgerEntry } from "./types.ts";

export function createLedger(
    accounts: readonly Account[],
): Ledger {
  void accounts;

  const storedEntries: LedgerEntry[] = [];
  let nextSequence = 1;

  return {
    append(request) {
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