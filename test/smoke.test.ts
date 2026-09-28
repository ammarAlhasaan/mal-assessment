import { test } from "node:test";
import assert from "node:assert/strict";
import { sayHello } from "../src/run.ts";

test("can say hello", () => {
  assert.equal(sayHello(), "Hello");
});
