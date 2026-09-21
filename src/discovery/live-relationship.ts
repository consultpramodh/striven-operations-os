import { loadConfig } from "../config/env.js";
import { StrivenTokenManager } from "../striven/auth.js";
import { StrivenReadOnlyClient } from "../striven/client.js";
import { ApiMeter } from "../striven/metrics.js";
import { probeCustomerGraph } from "./customer-graph.js";
import { probeSalesOrderRelationship } from "./sales-orders.js";

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.probeCustomerId === undefined) {
    console.error("Probe customer ID is unavailable.");
    process.exitCode = 1;
    return;
  }

  const meter = new ApiMeter();
  const tokens = new StrivenTokenManager(
    config.strivenBaseUrl,
    config.strivenClientId,
    config.strivenClientSecret,
  );
  const client = new StrivenReadOnlyClient(config.strivenBaseUrl, tokens, meter);

  try {
    await tokens.getAccessToken();
    console.log("Authentication: PASS");
  } catch {
    console.error("Authentication: FAIL");
    process.exitCode = 1;
    return;
  }

  try {
    const customerGraph = await probeCustomerGraph(client, config.probeCustomerId, 1);

    console.log(
      JSON.stringify({
        probe: "customerGraph",
        status: "PASS",
        primaryContactPresent: customerGraph.relationshipEvidence.primaryContactIdPresent,
        primaryContactResolved: customerGraph.relationshipEvidence.primaryContactResolved,
        assignmentsReadable:
          customerGraph.relationshipEvidence.assignmentsEndpointReadable,
        tasksQueryableByCustomer:
          customerGraph.relationshipEvidence.tasksQueryableByCustomerAccountId,
      }),
    );
  } catch {
    console.error("Customer graph verification: FAIL");
    process.exitCode = 1;
    return;
  }

  try {
    const relationship = await probeSalesOrderRelationship(
      client,
      config.probeCustomerId,
      config.stage0PageSize,
    );
    const evidence = relationship.evidence;

    const salesOrdersFound = evidence.salesOrdersReturned > 0;
    const allReturnedSalesOrdersBelongToCustomer =
      evidence.salesOrdersReturned === evidence.salesOrderRowsWithExpectedCustomer;
    const taskOrderReferencesPresent = evidence.tasksWithSalesOrderReference > 0;
    const matchingTaskOrderReferencePresent =
      evidence.taskSalesOrderReferencesFoundInCustomerOrders > 0;
    const noTaskOrderReferencesOutsideCustomer =
      evidence.taskSalesOrderReferencesOutsideCustomerOrders === 0;
    const allTaskDetailsInspected = !evidence.taskDetailsTruncated;

    const conclusive =
      salesOrdersFound &&
      taskOrderReferencesPresent &&
      matchingTaskOrderReferencePresent &&
      allReturnedSalesOrdersBelongToCustomer &&
      noTaskOrderReferencesOutsideCustomer &&
      allTaskDetailsInspected;

    console.log(
      JSON.stringify({
        probe: "customerSalesOrderTaskRelationship",
        status: conclusive ? "PASS" : "INCONCLUSIVE",
        salesOrdersFound,
        allReturnedSalesOrdersBelongToCustomer,
        taskOrderReferencesPresent,
        matchingTaskOrderReferencePresent,
        noTaskOrderReferencesOutsideCustomer,
        allTaskDetailsInspected,
      }),
    );

    console.log(
      JSON.stringify({
        apiUsage: meter.summary(),
        writesEnabled: false,
      }),
    );

    if (!conclusive) {
      process.exitCode = 2;
    }
  } catch {
    console.error("Customer → Sales Order → Task verification: FAIL");
    process.exitCode = 1;
  }
}

main().catch(() => {
  console.error("Live relationship verification failed safely.");
  process.exitCode = 1;
});
