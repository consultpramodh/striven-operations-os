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

// Current provider order:
// 1. Native metadata endpoints where Striven exposes field definitions.
// 2. Entity payload discovery for gaps or additional scope evidence.
// 3. Explicit mapping fallback only when the API cannot expose the definition.
//
// Never replace a stable field ID based on a fuzzy name match.
