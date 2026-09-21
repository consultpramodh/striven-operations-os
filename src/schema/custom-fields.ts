export type CustomFieldScope = "global" | "type-specific" | "unknown";
export type MappingStatus = "verified" | "candidate" | "needs-review" | "missing";

export interface CustomFieldOption {
  id: string | number | null;
  label: string;
  active: boolean | null;
}

export interface CustomFieldDefinition {
  entity: string;
  entityTypeId: string | number | null;
  fieldId: string | number;
  name: string;
  dataType: string | null;
  scope: CustomFieldScope;
  required: boolean | null;
  active: boolean | null;
  readable: boolean | null;
  writable: boolean | null;
  options: CustomFieldOption[];
  source: "native-metadata" | "entity-payload" | "explicit-mapping";
  mappingStatus: MappingStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface CustomFieldProvider {
  readonly name: CustomFieldDefinition["source"];
  discover(entity: string, entityTypeId?: string | number): Promise<CustomFieldDefinition[]>;
}

// Stage 0 will implement providers in this order:
// 1. Native metadata API, if Striven exposes sufficient definitions.
// 2. Entity payload discovery.
// 3. Explicit mapping fallback.
//
// We do not invent an endpoint for provider #1 until it is verified.
