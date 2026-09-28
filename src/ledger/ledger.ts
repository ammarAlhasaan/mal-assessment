import type { Account, Ledger } from "./types.ts";

export type { Account, Ledger } from "./types.ts";

export function createLedger(
    accounts: readonly Account[],
): Ledger {
  void accounts;

  return {
    entries() {
      return [];
    },
  };
}