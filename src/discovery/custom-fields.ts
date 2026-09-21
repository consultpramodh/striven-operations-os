import { StrivenReadOnlyClient } from "../striven/client.js";
import type { CustomFieldDefinition } from "../schema/custom-fields.js";

interface RawIdName {
  Id?: unknown;
  Name?: unknown;
}

interface RawCustomField {
  Id?: unknown;
  Name?: unknown;
  FieldType?: unknown;
  SourceId?: unknown;
  IsRequired?: unknown;
}

const ENTITY_ENDPOINTS = {
  Customers: "/v1/customers/0/custom-fields",
  "Sales Orders": "/v1/sales-orders/0/custom-fields",
  "Customer Assets": "/v1/customer-assets/0/custom-fields",
  Items: "/v1/items/0/custom-fields",
} as const;

export type DiscoverableCustomFieldEntity = keyof typeof ENTITY_ENDPOINTS;

function idName(value: unknown): RawIdName | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as RawIdName;
}

function normalize(
  entity: DiscoverableCustomFieldEntity,
  value: RawCustomField,
  observedAt: string,
): CustomFieldDefinition | undefined {
  if (typeof value.Id !== "number") return undefined;

  const fieldType = idName(value.FieldType);
  return {
    entity,
    entityTypeId: null,
    fieldId: value.Id,
    name: typeof value.Name === "string" ? value.Name : "",
    dataType: typeof fieldType?.Name === "string" ? fieldType.Name : null,
    scope: "global",
    required: typeof value.IsRequired === "boolean" ? value.IsRequired : null,
    active: null,
    readable: true,
    writable: null,
    options: [],
    source: "native-metadata",
    mappingStatus: "verified",
    firstSeenAt: observedAt,
    lastSeenAt: observedAt,
  };
}

export async function discoverEntityCustomFields(
  client: Pick<StrivenReadOnlyClient, "get">,
  entity: DiscoverableCustomFieldEntity,
): Promise<CustomFieldDefinition[]> {
  const payload = await client.get<unknown>(ENTITY_ENDPOINTS[entity]);
  if (!Array.isArray(payload)) {
    throw new Error(`Expected array from custom-field definition endpoint for ${entity}`);
  }

  const observedAt = new Date().toISOString();
  return payload
    .map((entry) =>
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? normalize(entity, entry as RawCustomField, observedAt)
        : undefined,
    )
    .filter((field): field is CustomFieldDefinition => field !== undefined);
}

export async function discoverGlobalCustomFields(
  client: Pick<StrivenReadOnlyClient, "get">,
): Promise<Record<DiscoverableCustomFieldEntity, CustomFieldDefinition[]>> {
  const entries = await Promise.all(
    (Object.keys(ENTITY_ENDPOINTS) as DiscoverableCustomFieldEntity[]).map(
      async (entity) => [entity, await discoverEntityCustomFields(client, entity)] as const,
    ),
  );

  return Object.fromEntries(entries) as Record<
    DiscoverableCustomFieldEntity,
    CustomFieldDefinition[]
  >;
}
