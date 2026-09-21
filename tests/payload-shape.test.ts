import assert from "node:assert/strict";
import test from "node:test";
import { summarizePayloadShape } from "../src/discovery/task-search.js";

test("summarizePayloadShape records structure without record values", () => {
  const payload = {
    pageIndex: 0,
    totalCount: 1,
    data: [
      {
        id: 12345,
        name: "Sensitive Customer Name",
        email: "private@example.com",
      },
    ],
  };

  const result = summarizePayloadShape(payload);
  const serialized = JSON.stringify(result);

  assert.equal(result.kind, "object");
  assert.deepEqual(result.topLevelKeys, ["pageIndex", "totalCount", "data"]);
  assert.deepEqual(result.arrayFields[0]?.firstItemKeys, ["id", "name", "email"]);
  assert.equal(serialized.includes("Sensitive Customer Name"), false);
  assert.equal(serialized.includes("private@example.com"), false);
  assert.equal(serialized.includes("12345"), false);
});

test("summarizePayloadShape handles arrays, primitives, and null", () => {
  assert.equal(summarizePayloadShape(null).kind, "null");
  assert.equal(summarizePayloadShape("ok").kind, "primitive");
  assert.equal(summarizePayloadShape([{ id: 1 }]).kind, "array");
});
