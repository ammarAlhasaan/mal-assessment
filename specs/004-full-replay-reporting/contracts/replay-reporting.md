# Contract: Replay and Reporting

Proposed; each row is confirmed at the start of its cycle and updated to match what is built.

| Function / value | Module | Behaviour | Cycle |
|------------------|--------|-----------|-------|
| `ASSESSMENT_ACCOUNTS`, `ASSESSMENT_EVENTS` | `src/replay/events.ts` | ACC-001 AED, ACC-002 BHD; E1–E10 in written order as frozen `ReplayEvent[]`; E10 carries `instalments: 3` (HC-8) | 1 — built |
| `replay(accounts, events)` | `src/replay/replay.ts` | Processes events in array order; daily close before the first higher event day; final close after the last event; returns ledger + one `CloseSnapshot` per day; instalments via `allocateEqually` + `appendAll`; rejected settlements kept as errors; final close = fees Days 1–6 then `capitalizeInterest` per account | 2 — built |
| `buildDailyReport(result)` | `src/report/report.ts` | One `DayReport` per close with as-known balances for every account | 3 |
| `renderReport(...)` | `src/report/render.ts` | Pure, deterministic text (research R3) | 4 |
| `src/run.ts` | entry point | `console.log(renderReport(...))` for the assessment stream; exit 0 | 5 |
