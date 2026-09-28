import type { CurrencyCode } from "../money/money.ts";

export interface Account {
  readonly id: string;
  readonly currency: CurrencyCode;
}

export interface Ledger {
  entries(): readonly unknown[];
}