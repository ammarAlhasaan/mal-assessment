import type { Account, Ledger } from "./types.ts";

export function createLedger(
    accounts: readonly Account[],
): Ledger {
  void accounts;

  return {
    append() {
      throw new Error("Not implemented");
    },

    entries() {
      return [];
    },
  };
}

export type {
  Account,
  Ledger,
  LedgerEntry,
  PostingRequest,
} from "./types.ts";