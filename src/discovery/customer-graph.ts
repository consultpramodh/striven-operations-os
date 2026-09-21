import { StrivenReadOnlyClient } from "../striven/client.js";
import { summarizePayloadShape, type PayloadShape } from "./task-search.js";

export interface CustomerGraphShape {
  customer: PayloadShape;
  primaryContact: PayloadShape | null;
  assignments: PayloadShape;
  tasks: PayloadShape;
  relationshipEvidence: {
    primaryContactIdPresent: boolean;
    primaryContactResolved: boolean;
    assignmentsEndpointReadable: boolean;
    tasksQueryableByCustomerAccountId: boolean;
  };
}

function getNestedId(payload: unknown, key: string): number | string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const value = (payload as Record<string, unknown>)[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const id = (value as Record<string, unknown>).id;
  return typeof id === "number" || typeof id === "string" ? id : undefined;
}

export async function probeCustomerGraph(
  client: StrivenReadOnlyClient,
  customerId: number,
  pageSize: number,
): Promise<CustomerGraphShape> {
  const customerPayload = await client.get<unknown>(`/v1/customers/${customerId}`);
  const primaryContactId = getNestedId(customerPayload, "primaryContact");

  let primaryContact: PayloadShape | null = null;
  let primaryContactResolved = false;

  if (primaryContactId !== undefined) {
    const contactPayload = await client.get<unknown>(`/v1/contacts/${primaryContactId}`);
    primaryContact = summarizePayloadShape(contactPayload);
    primaryContactResolved = true;
  }

  const assignmentsPayload = await client.get<unknown>(
    `/v1/customers/${customerId}/assignments`,
  );

  const tasksPayload = await client.search<unknown>("/v1/Tasks/Search", {
    AccountID: customerId,
    PageIndex: 0,
    PageSize: pageSize,
    SortExpression: "TaskName",
    SortOrder: 2,
  });

  return {
    customer: summarizePayloadShape(customerPayload),
    primaryContact,
    assignments: summarizePayloadShape(assignmentsPayload),
    tasks: summarizePayloadShape(tasksPayload),
    relationshipEvidence: {
      primaryContactIdPresent: primaryContactId !== undefined,
      primaryContactResolved,
      assignmentsEndpointReadable: true,
      tasksQueryableByCustomerAccountId: true,
    },
  };
}
