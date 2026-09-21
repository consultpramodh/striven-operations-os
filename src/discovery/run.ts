import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../config/env.js";
import { StrivenTokenManager } from "../striven/auth.js";
import { StrivenReadOnlyClient } from "../striven/client.js";
import { ApiMeter } from "../striven/metrics.js";
import { PHASE1_CAPABILITIES } from "./capabilities.js";
import { probeCustomerGraph, type CustomerGraphShape } from "./customer-graph.js";
import type { DiscoveryProbeResult, Stage0Manifest } from "./manifest.js";
import { DOCUMENTED_STATIC_LISTS } from "./static-lists.js";
import { probeTaskSearch, type PayloadShape } from "./task-search.js";
import { validateStage0Manifest } from "./validate-manifest.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const meter = new ApiMeter();
  const tokens = new StrivenTokenManager(
    config.strivenBaseUrl,
    config.strivenClientId,
    config.strivenClientSecret,
  );
  const client = new StrivenReadOnlyClient(config.strivenBaseUrl, tokens, meter);

  const blockers: string[] = [];

  const authentication: DiscoveryProbeResult = { state: "fail" };
  try {
    await tokens.getAccessToken();
    authentication.state = "pass";
  } catch (error) {
    authentication.detail = error instanceof Error ? error.message : String(error);
    blockers.push("Authentication failed.");
  }

  const taskSearch: DiscoveryProbeResult<PayloadShape> = { state: "skipped" };
  const customerGraph: DiscoveryProbeResult<CustomerGraphShape> = { state: "skipped" };

  if (authentication.state === "pass") {
    if (config.probeCustomerId === undefined) {
      taskSearch.detail = "STRIVEN_PROBE_CUSTOMER_ID is not configured.";
      customerGraph.detail = "STRIVEN_PROBE_CUSTOMER_ID is not configured.";
      blockers.push(
        "Customer/Task relationship probes were not run because STRIVEN_PROBE_CUSTOMER_ID is missing.",
      );
    } else {
      try {
        taskSearch.data = await probeTaskSearch(
          client,
          config.probeCustomerId,
          config.stage0PageSize,
        );
        taskSearch.state = "pass";
      } catch (error) {
        taskSearch.state = "fail";
        taskSearch.detail = error instanceof Error ? error.message : String(error);
        blockers.push("Verified Task Search probe failed.");
      }

      try {
        customerGraph.data = await probeCustomerGraph(
          client,
          config.probeCustomerId,
          config.stage0PageSize,
        );
        customerGraph.state = "pass";
      } catch (error) {
        customerGraph.state = "fail";
        customerGraph.detail = error instanceof Error ? error.message : String(error);
        blockers.push("Read-only Customer → Contact/Assignments/Tasks graph probe failed.");
      }
    }
  } else {
    taskSearch.detail = "Skipped because authentication did not pass.";
    customerGraph.detail = "Skipped because authentication did not pass.";
  }

  const pendingCapabilities = PHASE1_CAPABILITIES.filter(
    (capability) => capability.status === "pending-verification",
  );
  if (pendingCapabilities.length > 0) {
    blockers.push(
      `${pendingCapabilities.length} Phase-1 entity capability entries still require endpoint verification.`,
    );
  }

  blockers.push("Custom-field metadata discovery provider has not yet been verified against the live tenant.");
  blockers.push("Sales Order relationship resolution has not yet been verified in the new discovery engine.");

  const manifest: Stage0Manifest = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    mode: "discovery",
    connection: {
      baseUrl: config.strivenBaseUrl,
    },
    probeContext: {
      customerIdConfigured: config.probeCustomerId !== undefined,
    },
    capabilities: PHASE1_CAPABILITIES,
    documentedStaticLists: DOCUMENTED_STATIC_LISTS,
    probes: {
      authentication,
      taskSearch,
      customerGraph,
    },
    apiUsage: meter.summary(),
    readiness: {
      safeForControlledWrite: false,
      blockers,
    },
  };

  const validation = validateStage0Manifest(manifest);
  if (!validation.valid) {
    throw new Error(
      `Stage 0 manifest invariant failure:\n- ${validation.issues.join("\n- ")}`,
    );
  }

  const directory = resolve("tenant-manifest");
  const output = resolve(directory, "discovery-latest.json");
  await mkdir(directory, { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("Stage 0 discovery complete");
  console.log(`Authentication: ${authentication.state.toUpperCase()}`);
  console.log(`Task Search: ${taskSearch.state.toUpperCase()}`);
  console.log(`Customer Graph: ${customerGraph.state.toUpperCase()}`);
  console.log(`API calls: ${manifest.apiUsage.totalCalls}`);
  console.log("Controlled writes enabled: NO");
  console.log(`Blockers: ${blockers.length}`);
  console.log(`Manifest: ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
