import type { ApiCapability } from "./capabilities.js";
import type { PayloadShape } from "./task-search.js";

export type ProbeState = "pass" | "fail" | "skipped";

export interface DiscoveryProbeResult<T = unknown> {
  state: ProbeState;
  detail?: string;
  data?: T;
}

export interface Stage0Manifest {
  schemaVersion: 1;
  generatedAt: string;
  mode: "discovery";
  tenant: {
    baseUrl: string;
    accountId: number | null;
  };
  capabilities: readonly ApiCapability[];
  probes: {
    authentication: DiscoveryProbeResult;
    taskSearch: DiscoveryProbeResult<PayloadShape>;
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
