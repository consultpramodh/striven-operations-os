import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../config/env.js";
import { StrivenTokenManager } from "../striven/auth.js";
import { StrivenReadOnlyClient } from "../striven/client.js";
import { ApiMeter } from "../striven/metrics.js";
import { PHASE1_CAPABILITIES } from "./capabilities.js";
import type { DiscoveryProbeResult, Stage0Manifest } from "./manifest.js";
import { probeTaskSearch, type PayloadShape } from "./task-search.js";

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

  if (authentication.state === "pass") {
    if (config.accountId === undefined) {
      taskSearch.detail = "STRIVEN_ACCOUNT_ID is not configured.";
      blockers.push("Task Search probe was not run because STRIVEN_ACCOUNT_ID is missing.");
    } else {
      try {
        taskSearch.data = await probeTaskSearch(client, config.accountId, config.stage0PageSize);
        taskSearch.state = "pass";
      } catch (error) {
        taskSearch.state = "fail";
        taskSearch.detail = error instanceof Error ? error.message : String(error);
        blockers.push("Verified Task Search probe failed.");
      }
    }
  } else {
    taskSearch.detail = "Skipped because authentication did not pass.";
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
  blockers.push("Customer → Sales Order → Task relationship resolution has not yet been verified.");

  const manifest: Stage0Manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: "discovery",
    tenant: {
      baseUrl: config.strivenBaseUrl,
      accountId: config.accountId ?? null,
    },
    capabilities: PHASE1_CAPABILITIES,
    probes: {
      authentication,
      taskSearch,
    },
    apiUsage: meter.summary(),
    readiness: {
      safeForControlledWrite: false,
      blockers,
    },
  };

  const directory = resolve("tenant-manifest");
  const output = resolve(directory, "discovery-latest.json");
  await mkdir(directory, { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("Stage 0 discovery complete");
  console.log(`Authentication: ${authentication.state.toUpperCase()}`);
  console.log(`Task Search: ${taskSearch.state.toUpperCase()}`);
  console.log(`API calls: ${manifest.apiUsage.totalCalls}`);
  console.log(`Controlled writes enabled: NO`);
  console.log(`Blockers: ${blockers.length}`);
  console.log(`Manifest: ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
