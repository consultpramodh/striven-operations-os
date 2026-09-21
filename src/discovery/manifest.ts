import type { ApiCapability } from "./capabilities.js";
import type { CustomerGraphShape } from "./customer-graph.js";
import type { SalesOrderRelationshipShape } from "./sales-orders.js";
import type { DocumentedStaticLists } from "./static-lists.js";
import type { PayloadShape } from "./task-search.js";

export type ProbeState = "pass" | "fail" | "skipped";

export interface DiscoveryProbeResult<T = unknown> {
  state: ProbeState;
  detail?: string;
  data?: T;
}

export interface CustomFieldDiscoverySummary {
  customers: number;
  salesOrders: number;
  customerAssets: number;
  items: number;
}

export interface Stage0Manifest {
  schemaVersion: 3;
  generatedAt: string;
  mode: "discovery";
  connection: {
    baseUrl: string;
  };
  probeContext: {
    customerIdConfigured: boolean;
  };
  capabilities: readonly ApiCapability[];
  documentedStaticLists: DocumentedStaticLists;
  probes: {
    authentication: DiscoveryProbeResult;
    taskSearch: DiscoveryProbeResult<PayloadShape>;
    customerGraph: DiscoveryProbeResult<CustomerGraphShape>;
    salesOrderRelationship: DiscoveryProbeResult<SalesOrderRelationshipShape>;
    customFields: DiscoveryProbeResult<CustomFieldDiscoverySummary>;
  };
  apiUsage: {
    totalCalls: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  };
  readiness: {
    safeForControlledWrite: false;
    blockers: string[];
  };
}
