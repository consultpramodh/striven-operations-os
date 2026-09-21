import { loadConfig } from "../config/env.js";
import { StrivenTokenManager } from "../striven/auth.js";
import { StrivenReadOnlyClient } from "../striven/client.js";
import { ApiMeter } from "../striven/metrics.js";
import { discoverTaskTypeSchemas } from "./task-schema.js";
import { summarizePayloadShape } from "./task-search.js";

interface MetadataProbe {
  name: string;
  path: string;
}

const PROBES: readonly MetadataProbe[] = [
  { name: "customerCustomFields", path: "/v1/customers/0/custom-fields" },
  { name: "salesOrderCustomFields", path: "/v1/sales-orders/0/custom-fields" },
  { name: "customerAssetCustomFields", path: "/v1/customer-assets/0/custom-fields" },
  { name: "itemCustomFields", path: "/v1/items/0/custom-fields" },
  { name: "customerAssetTypes", path: "/v1/customer-assets/types" },
  { name: "activeEmployees", path: "/v1/employees" },
  { name: "taskTypes", path: "/v1/Tasks/types" },
  { name: "taskTypeZeroCustomFields", path: "/v1/Tasks/types/0/custom-fields" },
];

async function main(): Promise<void> {
  const config = loadConfig();
  const meter = new ApiMeter();
  const tokens = new StrivenTokenManager(
    config.strivenBaseUrl,
    config.strivenClientId,
    config.strivenClientSecret,
  );
  const client = new StrivenReadOnlyClient(config.strivenBaseUrl, tokens, meter);

  await tokens.getAccessToken();
  console.log("Authentication: PASS");

  let failures = 0;

  for (const probe of PROBES) {
    try {
      const payload = await client.get<unknown>(probe.path);
      const shape = summarizePayloadShape(payload);
      const rootArray = shape.arrayFields.find((field) => field.field === "$root");

      console.log(
        JSON.stringify({
          probe: probe.name,
          status: "PASS",
          kind: shape.kind,
          topLevelKeys: shape.topLevelKeys,
          firstItemKeys: rootArray?.firstItemKeys ?? [],
        }),
      );

      if (probe.name === "taskTypes" && Array.isArray(payload)) {
        const idCategories = new Set<string>();
        const rowShapes = new Set<string>();

        for (const row of payload) {
          if (!row || typeof row !== "object" || Array.isArray(row)) {
            rowShapes.add(typeof row);
            continue;
          }

          const object = row as Record<string, unknown>;
          rowShapes.add(Object.keys(object).sort().join(","));

          const id = object.taskTypeId ?? object.TaskTypeId ?? object.id ?? object.Id;
          if (id === null || id === undefined) {
            idCategories.add("missing-or-null");
          } else if (typeof id === "number") {
            idCategories.add(
              Number.isInteger(id)
                ? id > 0
                  ? "positive-integer"
                  : id === 0
                    ? "zero"
                    : "negative-integer"
                : "non-integer-number",
            );
          } else if (typeof id === "string") {
            idCategories.add(/^\d+$/.test(id) ? "digit-string" : "other-string");
          } else {
            idCategories.add(typeof id);
          }
        }

        console.log(
          JSON.stringify({
            probe: "taskTypeIdShapes",
            status: "INFO",
            idCategories: [...idCategories].sort(),
            rowShapes: [...rowShapes].sort(),
          }),
        );
      }
    } catch (error) {
      failures += 1;
      console.log(
        JSON.stringify({
          probe: probe.name,
          status: "FAIL",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  try {
    const taskSchema = await discoverTaskTypeSchemas(client, 30);
    console.log(
      JSON.stringify({
        probe: "taskTypeSchemas",
        status: taskSchema.allTaskTypesInspected ? "PASS" : "INCONCLUSIVE",
        taskTypesPresent: taskSchema.taskTypesDiscovered > 0,
        everyTaskTypeInspected: taskSchema.allTaskTypesInspected,
        atLeastOneTaskTypeHasCustomFields:
          taskSchema.taskTypesWithCustomFields > 0,
        customFieldDefinitionsExposeKeys:
          taskSchema.customFieldDefinitionKeys.length > 0,
      }),
    );

    if (!taskSchema.allTaskTypesInspected) failures += 1;
  } catch (error) {
    failures += 1;
    console.log(
      JSON.stringify({
        probe: "taskTypeSchemas",
        status: "FAIL",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  console.log(JSON.stringify({ apiUsage: meter.summary(), writesEnabled: false }));

  if (failures > 0) {
    throw new Error(`${failures} live metadata probe(s) failed.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
