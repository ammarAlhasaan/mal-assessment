import type {Day, Ledger, LedgerEntry, PostingRequest, ReplaySequence} from "../ledger/ledger.ts";
import type {AuthorizationRecord, AuthorizationRequest, SettlementRecord} from "../authorizations/types.ts";
import type {ReversalRequest} from "../reversals/types.ts";

export type ReplayEvent =
    | ({ readonly type: "POSTING"; readonly instalments?: number } & PostingRequest)
    | ({ readonly type: "AUTHORIZATION" } & AuthorizationRequest)
    | ({ readonly type: "SETTLEMENT" } & AuthorizationRequest)
    | ({ readonly type: "REVERSAL" } & ReversalRequest);

export interface CloseSnapshot {
    readonly day: Day;
    readonly events: readonly ReplayEvent[];
    readonly boundary: ReplaySequence;
    readonly fees: readonly LedgerEntry[];
    readonly interest: readonly LedgerEntry[];
    readonly authorizations: readonly (AuthorizationRecord | SettlementRecord)[];
    readonly errors: readonly SettlementRecord[];
}

export interface ReplayResult {
    readonly ledger: Ledger;
    readonly closes: readonly CloseSnapshot[];
}