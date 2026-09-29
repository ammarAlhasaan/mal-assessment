import {money} from "../money/money.ts";
import type {Account} from "../ledger/ledger.ts";
import type {ReplayEvent} from "./types.ts";

export const ASSESSMENT_ACCOUNTS: readonly Account[] = Object.freeze([
    {id: "ACC-001", currency: "AED"},
    {id: "ACC-002", currency: "BHD"},
]);

/** E1–E10 in the written replay order; E10 stays last although its event day is 5. */
export const ASSESSMENT_EVENTS: readonly ReplayEvent[] = Object.freeze([
    {
        type: "POSTING",
        eventId: "E1",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(120000n, "AED"),
        eventDay: 1,
        valueDay: 1
    },
    {
        type: "POSTING",
        eventId: "E2",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(95000n, "AED"),
        eventDay: 1,
        valueDay: 1
    },
    {
        type: "AUTHORIZATION",
        eventId: "E3",
        authorizationId: "Auth-A",
        accountId: "ACC-001",
        amount: money(20000n, "AED"),
        eventDay: 2,
        valueDay: 2
    },
    {
        type: "POSTING",
        eventId: "E4",
        accountId: "ACC-001",
        direction: "CREDIT",
        amount: money(40000n, "AED"),
        eventDay: 3,
        valueDay: 3
    },
    {
        type: "SETTLEMENT",
        eventId: "E5",
        authorizationId: "Auth-A",
        accountId: "ACC-001",
        amount: money(18500n, "AED"),
        eventDay: 4,
        valueDay: 4
    },
    {
        type: "SETTLEMENT",
        eventId: "E6",
        authorizationId: "Auth-Z",
        accountId: "ACC-001",
        amount: money(18000n, "AED"),
        eventDay: 4,
        valueDay: 4
    },
    {
        type: "POSTING",
        eventId: "E7",
        accountId: "ACC-001",
        direction: "DEBIT",
        amount: money(62000n, "AED"),
        eventDay: 5,
        valueDay: 2
    },
    {
        type: "AUTHORIZATION",
        eventId: "E8",
        authorizationId: "Auth-B",
        accountId: "ACC-001",
        amount: money(9000n, "AED"),
        eventDay: 5,
        valueDay: 5
    },
    {type: "REVERSAL", eventId: "E9", targetEventId: "E7", eventDay: 6, valueDay: 2},
    {
        type: "POSTING",
        eventId: "E10",
        accountId: "ACC-002",
        direction: "CREDIT",
        amount: money(10000n, "BHD"),
        instalments: 3,
        eventDay: 5,
        valueDay: 5
    },
]);