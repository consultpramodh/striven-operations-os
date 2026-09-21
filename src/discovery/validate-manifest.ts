import type { Stage0Manifest } from "./manifest.js";

export interface ManifestValidationResult {
  valid: boolean;
  issues: string[];
}

export function validateStage0Manifest(manifest: Stage0Manifest): ManifestValidationResult {
  const issues: string[] = [];

  if (manifest.mode !== "discovery") {
    issues.push("Stage 0 manifest mode must be discovery.");
  }

  if (manifest.readiness.safeForControlledWrite !== false) {
    issues.push("Stage 0 must never claim controlled writes are safe.");
  }

  for (const capability of manifest.capabilities) {
    if (capability.status === "pending-verification" && capability.stage0Allowed) {
      issues.push(
        `Pending capability must not be enabled: ${capability.entity} / ${capability.operation}`,
      );
    }

    if (
      capability.stage0Allowed &&
      capability.method === "POST" &&
      !capability.pathTemplate?.toLowerCase().endsWith("/search")
    ) {
      issues.push(
        `Stage 0 POST must be an explicit /Search endpoint: ${capability.entity} / ${capability.operation}`,
      );
    }

    if (capability.stage0Allowed && !capability.pathTemplate) {
      issues.push(
        `Enabled capability is missing a verified path: ${capability.entity} / ${capability.operation}`,
      );
    }

    if (capability.status !== "pending-verification" && capability.evidence === "Not verified") {
      issues.push(
        `Verified capability is missing evidence: ${capability.entity} / ${capability.operation}`,
      );
    }
  }

  const callsByMethod = Object.values(manifest.apiUsage.byMethod).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (callsByMethod !== manifest.apiUsage.totalCalls) {
    issues.push(
      `API usage mismatch: totalCalls=${manifest.apiUsage.totalCalls}, byMethod=${callsByMethod}`,
    );
  }

  if ("customerId" in manifest.probeContext) {
    issues.push("Probe context must not persist the configured customer ID.");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
