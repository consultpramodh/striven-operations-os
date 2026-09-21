import assert from "node:assert/strict";
import test from "node:test";
import { PHASE1_CAPABILITIES } from "../src/discovery/capabilities.js";

test("pending capabilities are never enabled", () => {
  for (const capability of PHASE1_CAPABILITIES) {
    if (capability.status === "pending-verification") {
      assert.equal(
        capability.stage0Allowed,
        false,
        `${capability.entity} / ${capability.operation} must remain blocked`,
      );
    }
  }
});

test("every enabled Stage 0 POST is an explicit Search endpoint", () => {
  const enabledPosts = PHASE1_CAPABILITIES.filter(
    (capability) => capability.stage0Allowed && capability.method === "POST",
  );

  assert.ok(enabledPosts.length > 0);

  for (const capability of enabledPosts) {
    assert.ok(capability.pathTemplate);
    assert.match(capability.pathTemplate, /\/Search$/i);
  }
});

test("verified capabilities have evidence", () => {
  for (const capability of PHASE1_CAPABILITIES) {
    if (capability.status !== "pending-verification") {
      assert.notEqual(capability.evidence, "Not verified");
      assert.ok(capability.pathTemplate);
    }
  }
});
