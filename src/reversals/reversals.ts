import type {Ledger, LedgerEntry} from "../ledger/ledger.ts";
import type {ReversalRequest} from "./types.ts";

/** Thrown when a reversal target does not match exactly one ledger entry. */
export class InvalidReversalTargetError extends Error {
    override name = "InvalidReversalTargetError";
}

export function reverse(ledger: Ledger, request: ReversalRequest): LedgerEntry {
    throw new Error("Not implemented");
}