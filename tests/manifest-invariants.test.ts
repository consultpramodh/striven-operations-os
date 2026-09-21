import assert from "node:assert/strict";
import test from "node:test";
import { PHASE1_CAPABILITIES } from "../src/discovery/capabilities.js";
import type { Stage0Manifest } from "../src/discovery/manifest.js";
import { DOCUMENTED_STATIC_LISTS } from "../src/discovery/static-lists.js";
import { validateStage0Manifest } from "../src/discovery/validate-manifest.js";

function validManifest(): Stage0Manifest {
  return {
    schemaVersion: 2,
    generatedAt: "2026-09-21T00:00:00.000Z",
    mode: "discovery",
    connection: { baseUrl: "https://api.striven.com" },
    probeContext: { customerIdConfigured: true },
    capabilities: PHASE1_CAPABILITIES,
    documentedStaticLists: DOCUMENTED_STATIC_LISTS,
    probes: {
      authentication: { state: "pass" },
      taskSearch: { state: "skipped" },
      customerGraph: { state: "skipped" },
    },
    apiUsage: {
      totalCalls: 2,
      byMethod: { GET: 1, POST: 1 },
      byStatus: { "200": 2 },
    },
    readiness: {
      safeForControlledWrite: false,
      blockers: ["Controlled writes remain disabled."],
    },
  };
}

test("valid Stage 0 manifest passes invariant checks", () => {
  assert.deepEqual(validateStage0Manifest(validManifest()), {
    valid: true,
    issues: [],
  });
});

test("manifest rejects a pending capability that is accidentally enabled", () => {
  const manifest = validManifest();
  manifest.capabilities = [
    ...manifest.capabilities,
    {
      entity: "Sales Orders",
      operation: "Guessed search",
      method: "POST",
      pathTemplate: "/v1/Orders/Search",
      stage0Allowed: true,
      status: "pending-verification",
      evidence: "Not verified",
    },
  ];

  const result = validateStage0Manifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes("Pending capability")));
});

test("manifest rejects a non-search POST", () => {
  const manifest = validManifest();
  manifest.capabilities = [
    ...manifest.capabilities,
    {
      entity: "Tasks",
      operation: "Create",
      method: "POST",
      pathTemplate: "/v1/Tasks",
      stage0Allowed: true,
      status: "verified-existing-live-project",
      evidence: "test-only",
    },
  ];

  const result = validateStage0Manifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes("/Search")));
});
