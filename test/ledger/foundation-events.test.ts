import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createLedger,
} from "../../src/ledger/ledger.ts";
import type {
  Day,
  PostingRequest,
} from "../../src/ledger/ledger.ts";
import {
  allocateEqually,
  money,
} from "../../src/money/money.ts";

test("replays the Spec 1 events and produces the expected balances", () => {
  const ledger = createLedger([
    { id: "ACC-001", currency: "AED" },
    { id: "ACC-002", currency: "BHD" },
  ]);

  ledger.append({
    eventId: "E1",
    accountId: "ACC-001",
    direction: "CREDIT",
    amount: money(120000n, "AED"),
    eventDay: 1,
    valueDay: 1,
  });

  ledger.append({
    eventId: "E2",
    accountId: "ACC-001",
    direction: "DEBIT",
    amount: money(95000n, "AED"),
    eventDay: 1,
    valueDay: 1,
  });

  ledger.append({
    eventId: "E4",
    accountId: "ACC-001",
    direction: "CREDIT",
    amount: money(40000n, "AED"),
    eventDay: 3,
    valueDay: 3,
  });

  const beforeE7 = ledger.lastSequence();

  ledger.append({
    eventId: "E7",
    accountId: "ACC-001",
    direction: "DEBIT",
    amount: money(62000n, "AED"),
    eventDay: 5,
    valueDay: 2,
  });

  const e10Requests = allocateEqually(
      money(10000n, "BHD"),
      3,
  ).map((amount): PostingRequest => ({
    eventId: "E10",
    accountId: "ACC-002",
    direction: "CREDIT",
    amount,
    eventDay: 5,
    valueDay: 5,
  }));

  ledger.appendAll(e10Requests);

  const days: readonly Day[] = [1, 2, 3, 4, 5, 6];

  assert.deepEqual(
      days.map(
          (day) =>
              ledger.balanceByValueDay("ACC-001", day).minorUnits,
      ),
      [25000n, -37000n, 3000n, 3000n, 3000n, 3000n],
  );

  assert.deepEqual(
      days.map(
          (day) =>
              ledger.balanceAsKnownAt(
                  "ACC-001",
                  day,
                  beforeE7,
              ).minorUnits,
      ),
      [25000n, 25000n, 65000n, 65000n, 65000n, 65000n],
  );

  assert.deepEqual(
      days.map(
          (day) =>
              ledger.balanceByValueDay("ACC-002", day).minorUnits,
      ),
      [0n, 0n, 0n, 0n, 10000n, 10000n],
  );

  // Acceptance criterion 1 is correct.
  assert.deepEqual(
      ledger.balanceByValueDay("ACC-001", 2),
      money(-37000n, "AED"),
  );
});