import type {Money} from "../money/money.ts";
import type {Day} from "../ledger/ledger.ts";

export interface AuthorizationRequest {
    readonly eventId: string;
    readonly authorizationId: string;
    readonly accountId: string;
    readonly amount: Money;
    readonly eventDay: Day;
    readonly valueDay: Day;
}

export type AuthorizationOutcome = "APPROVED" | "REJECTED";

export type SettlementRequest = AuthorizationRequest;
export type SettlementOutcome = "SETTLED" | "REJECTED";

export interface AuthorizationRecord extends AuthorizationRequest {
    readonly outcome: AuthorizationOutcome;
}

export interface Authorizations {
    authorize(request: AuthorizationRequest): AuthorizationRecord;
    settle(request: SettlementRequest): SettlementRecord;
    lookup(authorizationId: string): AuthorizationRecord | SettlementRecord | undefined;
}

export interface SettlementRecord extends SettlementRequest {
    readonly outcome: SettlementOutcome;
}