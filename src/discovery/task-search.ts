import { StrivenReadOnlyClient } from "../striven/client.js";

export interface PayloadShape {
  kind: "array" | "object" | "primitive" | "null";
  topLevelKeys: string[];
  arrayFields: Array<{
    field: string;
    length: number;
    firstItemKeys: string[];
  }>;
}

export function summarizePayloadShape(payload: unknown): PayloadShape {
  if (payload === null) {
    return { kind: "null", topLevelKeys: [], arrayFields: [] };
  }

  if (Array.isArray(payload)) {
    const first = payload[0];
    return {
      kind: "array",
      topLevelKeys: [],
      arrayFields: [
        {
          field: "$root",
          length: payload.length,
          firstItemKeys:
            first && typeof first === "object" && !Array.isArray(first) ? Object.keys(first) : [],
        },
      ],
    };
  }

  if (typeof payload !== "object") {
    return { kind: "primitive", topLevelKeys: [], arrayFields: [] };
  }

  const object = payload as Record<string, unknown>;
  const arrayFields = Object.entries(object)
    .filter(([, value]) => Array.isArray(value))
    .map(([field, value]) => {
      const array = value as unknown[];
      const first = array[0];
      return {
        field,
        length: array.length,
        firstItemKeys:
          first && typeof first === "object" && !Array.isArray(first) ? Object.keys(first) : [],
      };
    });

  return {
    kind: "object",
    topLevelKeys: Object.keys(object),
    arrayFields,
  };
}

export async function probeTaskSearch(
  client: StrivenReadOnlyClient,
  accountId: number,
  pageSize: number,
): Promise<PayloadShape> {
  const payload = await client.search<unknown>("/v1/Tasks/Search", {
    AccountID: accountId,
    PageIndex: 0,
    PageSize: pageSize,
    SortExpression: "TaskName",
    SortOrder: 2,
  });

  return summarizePayloadShape(payload);
}
