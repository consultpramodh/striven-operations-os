export type CapabilityStatus = "verified-official-docs" | "pending-verification";

export interface ApiCapability {
  entity: string;
  operation: string;
  method: "GET" | "POST";
  path: string | null;
  stage0Allowed: boolean;
  status: CapabilityStatus;
}

export const PHASE1_CAPABILITIES: readonly ApiCapability[] = [
  {
    entity: "Tasks",
    operation: "Search",
    method: "POST",
    path: "/v1/Tasks/Search",
    stage0Allowed: true,
    status: "verified-official-docs",
  },
  ...["Customers", "Contacts", "Sales Orders", "Customer Assets", "Employees", "Locations", "Items"].map(
    (entity): ApiCapability => ({
      entity,
      operation: "Discovery",
      method: "GET",
      path: null,
      stage0Allowed: false,
      status: "pending-verification",
    }),
  ),
];
