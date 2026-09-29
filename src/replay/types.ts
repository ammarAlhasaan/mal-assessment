import type {PostingRequest} from "../ledger/ledger.ts";
import type {AuthorizationRequest} from "../authorizations/types.ts";
import type {ReversalRequest} from "../reversals/types.ts";

export type ReplayEvent =
    | ({ readonly type: "POSTING"; readonly instalments?: number } & PostingRequest)
    | ({ readonly type: "AUTHORIZATION" } & AuthorizationRequest)
    | ({ readonly type: "SETTLEMENT" } & AuthorizationRequest)
    | ({ readonly type: "REVERSAL" } & ReversalRequest);