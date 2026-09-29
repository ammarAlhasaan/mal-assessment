# Data Model: Full Replay, Reporting, and Delivery

Proposed, minimum types; confirmed per cycle. No ledger entity changes.

| Type | Fields | Notes |
|------|--------|-------|
| `ReplayEvent` | union by `type`: `POSTING` (`PostingRequest` + optional `instalments`), `AUTHORIZATION` / `SETTLEMENT` (`AuthorizationRequest`), `REVERSAL` (`ReversalRequest`) | Built in cycle 1, `src/replay/types.ts`; reuses Spec 1–3 request types (HC-8) |
| `CloseSnapshot` | `day`, `eventIds`, `boundary` (ledger `lastSequence()` after the close), `fees: LedgerEntry[]`, `interest: LedgerEntry[]`, `authorizations: (AuthorizationRecord \| SettlementRecord)[]`, `errors: SettlementRecord[]` | One per close, Days 1–6 |
| `ReplayResult` | `ledger`, `closes: CloseSnapshot[]` | |
| `DayReport` | `day`, `eventIds`, `balances: {accountId, balance: Money}[]`, `fees`, `interest`, `authorizations`, `errors` | Built from a snapshot; balances via `balanceAsKnownAt` (HC-1) |
