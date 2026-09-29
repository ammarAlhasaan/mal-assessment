import type {Day} from "../ledger/ledger.ts";

export interface ReversalRequest {
    readonly eventId: string;
    readonly targetEventId: string;
    readonly eventDay: Day;
    readonly valueDay: Day;
}