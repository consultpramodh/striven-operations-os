import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../config/env.js";
import { StrivenTokenManager } from "../striven/auth.js";
import { StrivenReadOnlyClient } from "../striven/client.js";
import { ApiMeter } from "../striven/metrics.js";
import { PHASE1_CAPABILITIES } from "./capabilities.js";
import { discoverGlobalCustomFields } from "./custom-fields.js";
import { probeCustomerGraph, type CustomerGraphShape } from "./customer-graph.js";
import type {
  CustomFieldDiscoverySummary,
  DiscoveryProbeResult,
  Stage0Manifest,
} from "./manifest.js";
import {
  probeSalesOrderRelationship,
  type SalesOrderRelationshipShape,
} from "./sales-orders.js";
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
  const taskSearch: DiscoveryProbeResult<PayloadShape> = { state: "skipped" };
  const customerGraph: DiscoveryProbeResult<CustomerGraphShape> = { state: "skipped" };
  const salesOrderRelationship: DiscoveryProbeResult<SalesOrderRelationshipShape> = {
    state: "skipped",
  };
  const customFields: DiscoveryProbeResult<CustomFieldDiscoverySummary> = {
    state: "skipped",
  };

  try {
    await tokens.getAccessToken();
    authentication.state = "pass";
  } catch (error) {
    authentication.detail = error instanceof Error ? error.message : String(error);
    blockers.push("Authentication failed.");
  }

  if (authentication.state === "pass") {
    try {
      const discovered = await discoverGlobalCustomFields(client);
      customFields.data = {
        customers: discovered.Customers.length,
        salesOrders: discovered["Sales Orders"].length,
        customerAssets: discovered["Customer Assets"].length,
        items: discovered.Items.length,
      };
      customFields.state = "pass";
    } catch (error) {
      customFields.state = "fail";
      customFields.detail = error instanceof Error ? error.message : String(error);
      blockers.push("Native custom-field metadata discovery failed.");
    }

    if (config.probeCustomerId === undefined) {
      taskSearch.detail = "STRIVEN_PROBE_CUSTOMER_ID is not configured.";
      customerGraph.detail = "STRIVEN_PROBE_CUSTOMER_ID is not configured.";
      salesOrderRelationship.detail = "STRIVEN_PROBE_CUSTOMER_ID is not configured.";
      blockers.push(
        "Customer/Task/Sales Order relationship probes were not run because STRIVEN_PROBE_CUSTOMER_ID is missing.",
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

      try {
        salesOrderRelationship.data = await probeSalesOrderRelationship(
          client,
          config.probeCustomerId,
          config.stage0PageSize,
        );
        salesOrderRelationship.state = "pass";
      } catch (error) {
        salesOrderRelationship.state = "fail";
        salesOrderRelationship.detail =
          error instanceof Error ? error.message : String(error);
        blockers.push("Read-only Customer → Sales Order → Task relationship probe failed.");
      }
    }
  } else {
    taskSearch.detail = "Skipped because authentication did not pass.";
    customerGraph.detail = "Skipped because authentication did not pass.";
    salesOrderRelationship.detail = "Skipped because authentication did not pass.";
    customFields.detail = "Skipped because authentication did not pass.";
  }

  const pendingCapabilities = PHASE1_CAPABILITIES.filter(
    (capability) => capability.status === "pending-verification",
  );
  if (pendingCapabilities.length > 0) {
    blockers.push(
      `${pendingCapabilities.length} Phase-1 capability entries still require endpoint verification.`,
    );
  }

  if (customFields.state !== "pass") {
    blockers.push("Custom-field definition discovery is not yet proven for this tenant.");
  }
  if (salesOrderRelationship.state !== "pass") {
    blockers.push("Customer → Sales Order → Task resolution is not yet proven for this tenant.");
  }

  const manifest: Stage0Manifest = {
    schemaVersion: 3,
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
      salesOrderRelationship,
      customFields,
    },
    apiUsage: meter.summary(),
    readiness: {
      safeForControlledWrite: false,
      blockers: [...new Set(blockers)],
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
  console.log(`Custom Fields: ${customFields.state.toUpperCase()}`);
  console.log(`Task Search: ${taskSearch.state.toUpperCase()}`);
  console.log(`Customer Graph: ${customerGraph.state.toUpperCase()}`);
  console.log(`Sales Order Relationship: ${salesOrderRelationship.state.toUpperCase()}`);
  console.log(`API calls: ${manifest.apiUsage.totalCalls}`);
  console.log("Controlled writes enabled: NO");
  console.log(`Blockers: ${manifest.readiness.blockers.length}`);
  console.log(`Manifest: ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
