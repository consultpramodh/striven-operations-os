import assert from "node:assert/strict";
import test from "node:test";
import { DOCUMENTED_STATIC_LISTS } from "../src/discovery/static-lists.js";

function assertUniqueIds(entries: readonly { id: number; name: string }[]): void {
  const ids = entries.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
}

test("documented static lists have unique IDs", () => {
  assertUniqueIds(DOCUMENTED_STATIC_LISTS.customerVendorStatus);
  assertUniqueIds(DOCUMENTED_STATIC_LISTS.customerAssetStatus);
  assertUniqueIds(DOCUMENTED_STATIC_LISTS.orderStatus);
  assertUniqueIds(DOCUMENTED_STATIC_LISTS.taskStatus);
});

test("critical workflow statuses remain mapped to documented IDs", () => {
  assert.deepEqual(
    DOCUMENTED_STATIC_LISTS.orderStatus.find((status) => status.name === "Approved"),
    { id: 22, name: "Approved" },
  );
  assert.deepEqual(
    DOCUMENTED_STATIC_LISTS.taskStatus.find((status) => status.name === "Open"),
    { id: 48, name: "Open" },
  );
  assert.deepEqual(
    DOCUMENTED_STATIC_LISTS.taskStatus.find((status) => status.name === "Done"),
    { id: 50, name: "Done" },
  );
});
