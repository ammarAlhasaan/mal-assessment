import { test } from "node:test";
import assert from "node:assert/strict";
import { createLedger } from "../../src/ledger/ledger.ts";
import { money } from "../../src/money/money.ts";

test("a new ledger has no entries", () => {
  const ledger = createLedger([
    { id: "ACC-001", currency: "AED" },
    { id: "ACC-002", currency: "BHD" },
  ]);

  assert.deepEqual(ledger.entries(), []);
});

test("appends E1 as the first ledger entry", () => {
  const ledger = createLedger([
    { id: "ACC-001", currency: "AED" },
  ]);

  const entry = ledger.append({
    eventId: "E1",
    accountId: "ACC-001",
    direction: "CREDIT",
    amount: money(120000n, "AED"),
    eventDay: 1,
    valueDay: 1,
  });

  assert.deepEqual(entry, {
    eventId: "E1",
    accountId: "ACC-001",
    direction: "CREDIT",
    amount: money(120000n, "AED"),
    eventDay: 1,
    valueDay: 1,
    sequence: 1,
  });

  assert.deepEqual(ledger.entries(), [entry]);
});