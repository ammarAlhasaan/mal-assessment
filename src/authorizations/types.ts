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

export interface AuthorizationRecord extends AuthorizationRequest {
    readonly outcome: AuthorizationOutcome;
}

export interface Authorizations {
    authorize(request: AuthorizationRequest): AuthorizationRecord;
    lookup(authorizationId: string): AuthorizationRecord | undefined;
}