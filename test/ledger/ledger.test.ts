import { test } from "node:test";
import assert from "node:assert/strict";
import { createLedger } from "../../src/ledger/ledger.ts";

test("a new ledger has no entries", () => {
  const ledger = createLedger([
    { id: "ACC-001", currency: "AED" },
    { id: "ACC-002", currency: "BHD" },
  ]);

  assert.deepEqual(ledger.entries(), []);
});