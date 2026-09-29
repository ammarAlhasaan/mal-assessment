import type {Day, Ledger, LedgerEntry} from "../ledger/ledger.ts";

export function assessOverdraftFees(
    ledger: Ledger,
    accountId: string,
    assessmentDay: Day,
): readonly LedgerEntry[] {
    throw new Error("Not implemented");
}