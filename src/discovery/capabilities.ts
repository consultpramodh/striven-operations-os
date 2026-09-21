export type CapabilityStatus =
  | "verified-official-docs"
  | "verified-existing-live-project"
  | "pending-verification";

export interface ApiCapability {
  entity: string;
  operation: string;
  method: "GET" | "POST";
  pathTemplate: string | null;
  stage0Allowed: boolean;
  status: CapabilityStatus;
  evidence: string;
}

const PRIOR_LIVE_EVIDENCE =
  "consultpramodh/striven-flow@5d3252b35c463eb54fe4fe80315771eec5983abe";

export const PHASE1_CAPABILITIES: readonly ApiCapability[] = [
  {
    entity: "Tasks",
    operation: "Search",
    method: "POST",
    pathTemplate: "/v1/Tasks/Search",
    stage0Allowed: true,
    status: "verified-official-docs",
    evidence: "https://api.striven.com/help",
  },
  {
    entity: "Customers",
    operation: "Get by ID",
    method: "GET",
    pathTemplate: "/v1/customers/{customerId}",
    stage0Allowed: true,
    status: "verified-existing-live-project",
    evidence: PRIOR_LIVE_EVIDENCE,
  },
  {
    entity: "Contacts",
    operation: "Get by ID",
    method: "GET",
    pathTemplate: "/v1/contacts/{contactId}",
    stage0Allowed: true,
    status: "verified-existing-live-project",
    evidence: PRIOR_LIVE_EVIDENCE,
  },
  {
    entity: "Customers",
    operation: "Get assignments",
    method: "GET",
    pathTemplate: "/v1/customers/{customerId}/assignments",
    stage0Allowed: true,
    status: "verified-existing-live-project",
    evidence: PRIOR_LIVE_EVIDENCE,
  },
  ...["Sales Orders", "Customer Assets", "Employees", "Locations", "Items"].map(
    (entity): ApiCapability => ({
      entity,
      operation: "Discovery",
      method: "GET",
      pathTemplate: null,
      stage0Allowed: false,
      status: "pending-verification",
      evidence: "Not verified",
    }),
  ),
];
