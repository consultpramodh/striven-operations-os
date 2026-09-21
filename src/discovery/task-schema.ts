import { StrivenReadOnlyClient } from "../striven/client.js";
import { summarizePayloadShape, type PayloadShape } from "./task-search.js";

type GetClient = Pick<StrivenReadOnlyClient, "get">;

function rows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter(
      (row): row is Record<string, unknown> =>
        Boolean(row) && typeof row === "object" && !Array.isArray(row),
    );
  }

  if (!payload || typeof payload !== "object") return [];

  const object = payload as Record<string, unknown>;
  for (const candidate of [object.Data, object.data, object.Items, object.items]) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (row): row is Record<string, unknown> =>
          Boolean(row) && typeof row === "object" && !Array.isArray(row),
      );
    }
  }

  return [];
}

function rowId(row: Record<string, unknown>): number | undefined {
  const value = row.Id ?? row.ID ?? row.id ?? row.TaskTypeId ?? row.taskTypeId;
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10);
    return parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

export interface TaskTypeSchemaSummary {
  taskTypes: PayloadShape;
  taskTypesDiscovered: number;
  taskTypesInspected: number;
  allTaskTypesInspected: boolean;
  taskTypesWithCustomFields: number;
  customFieldDefinitionKeys: string[];
}

export async function discoverTaskTypeSchemas(
  client: GetClient,
  maxTaskTypes = 30,
): Promise<TaskTypeSchemaSummary> {
  if (!Number.isInteger(maxTaskTypes) || maxTaskTypes <= 0) {
    throw new Error("maxTaskTypes must be a positive integer");
  }

  const payload = await client.get<unknown>("/v1/Tasks/types");
  const typeRows = rows(payload);
  const typeIds = typeRows
    .map(rowId)
    .filter((id): id is number => id !== undefined);

  if (typeRows.length > 0 && typeIds.length !== typeRows.length) {
    throw new Error("One or more Task Types did not expose a stable numeric ID");
  }

  const idsToInspect = typeIds.slice(0, maxTaskTypes);
  let taskTypesWithCustomFields = 0;
  const definitionKeys = new Set<string>();

  for (const typeId of idsToInspect) {
    const fields = await client.get<unknown>(
      `/v1/Tasks/types/${typeId}/custom-fields`,
    );

    if (!Array.isArray(fields)) {
      throw new Error("Unexpected Task Type custom-field response shape");
    }

    if (fields.length > 0) taskTypesWithCustomFields += 1;

    for (const field of fields) {
      if (!field || typeof field !== "object" || Array.isArray(field)) continue;
      for (const key of Object.keys(field)) definitionKeys.add(key);
    }
  }

  return {
    taskTypes: summarizePayloadShape(payload),
    taskTypesDiscovered: typeIds.length,
    taskTypesInspected: idsToInspect.length,
    allTaskTypesInspected: typeIds.length <= maxTaskTypes,
    taskTypesWithCustomFields,
    customFieldDefinitionKeys: [...definitionKeys].sort(),
  };
}
