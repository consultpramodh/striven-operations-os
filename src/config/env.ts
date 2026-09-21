export interface AppConfig {
  strivenClientId: string;
  strivenClientSecret: string;
  strivenBaseUrl: string;
  probeCustomerId: number | undefined;
  stage0PageSize: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInteger(name: string, value: string | undefined, fallback?: number): number | undefined {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function loadConfig(): AppConfig {
  const probeCustomerId = positiveInteger(
    "STRIVEN_PROBE_CUSTOMER_ID",
    process.env.STRIVEN_PROBE_CUSTOMER_ID,
  );
  const stage0PageSize = positiveInteger("STAGE0_PAGE_SIZE", process.env.STAGE0_PAGE_SIZE, 1);

  return {
    strivenClientId: required("STRIVEN_CLIENT_ID"),
    strivenClientSecret: required("STRIVEN_CLIENT_SECRET"),
    strivenBaseUrl: process.env.STRIVEN_BASE_URL?.trim() || "https://api.striven.com",
    probeCustomerId,
    stage0PageSize: stage0PageSize ?? 1,
  };
}
