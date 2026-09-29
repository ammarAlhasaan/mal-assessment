# Data Model: Full Replay, Reporting, and Delivery

Proposed, minimum types; confirmed per cycle. No ledger entity changes.

| Type | Fields | Notes |
|------|--------|-------|
| `ReplayEvent` | union by `type`: `POSTING` (`PostingRequest` + optional `instalments`), `AUTHORIZATION` / `SETTLEMENT` (`AuthorizationRequest`), `REVERSAL` (`ReversalRequest`) | Built in cycle 1, `src/replay/types.ts`; reuses Spec 1–3 request types (HC-8) |
| `CloseSnapshot` | `day`, `events: ReplayEvent[]`, `boundary` (ledger `lastSequence()` after the close), `fees: LedgerEntry[]`, `interest: LedgerEntry[]`, `authorizations: (AuthorizationRecord \| SettlementRecord)[]`, `errors: SettlementRecord[]` | Built in cycle 2; one per close, Days 1–6; frozen |
| `ReplayResult` | `ledger`, `closes: CloseSnapshot[]` | Built in cycle 2 |
| `DayReport` | `CloseSnapshot` without `boundary`, plus `balances: AccountBalance[]` | Built in cycle 3, `src/report/types.ts`; balances via `balanceAsKnownAt` (HC-1) |
| `Report` | `days: DayReport[]`, `finalBalances: {day, balances: AccountBalance[]}[]` | Built in cycle 3; final table via `balanceByValueDay` (HC-1) |
