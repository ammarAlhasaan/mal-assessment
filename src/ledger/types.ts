import type {
  CurrencyCode,
  Money,
} from "../money/money.ts";


export type Day = 1 | 2 | 3 | 4 | 5 | 6;
export type EntryDirection = "CREDIT" | "DEBIT";
export type ReplaySequence = number;

export interface Account {
  readonly id: string;
  readonly currency: CurrencyCode;
}

export interface PostingRequest {
  readonly eventId: string;
  readonly accountId: string;
  readonly direction: EntryDirection;
  readonly amount: Money;
  readonly eventDay: Day;
  readonly valueDay: Day;
}

export interface LedgerEntry extends PostingRequest {
  readonly sequence: number;
}

export interface Ledger {
  append(request: PostingRequest): LedgerEntry;
  entries(accountId?: string): readonly LedgerEntry[];
  lastSequence(): ReplaySequence;
  appendAll(
      requests: readonly PostingRequest[],
  ): readonly LedgerEntry[];
}