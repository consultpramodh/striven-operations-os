import { StrivenReadOnlyClient } from "../striven/client.js";
import { summarizePayloadShape, type PayloadShape } from "./task-search.js";

interface SearchEnvelope {
  TotalCount?: unknown;
  Data?: unknown;
}

function rows(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const data = (payload as SearchEnvelope).Data;
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row),
  );
}

function nestedId(value: unknown): number | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const id = (value as Record<string, unknown>).Id;
  return typeof id === "number" ? id : undefined;
}

export interface SalesOrderRelationshipShape {
  salesOrders: PayloadShape;
  tasks: PayloadShape;
  evidence: {
    salesOrdersReturned: number;
    salesOrderRowsWithExpectedCustomer: number;
    tasksReturned: number;
    tasksWithSalesOrderReference: number;
    taskSalesOrderReferencesFoundInCustomerOrders: number;
    taskSalesOrderReferencesOutsideCustomerOrders: number;
  };
}

export async function probeSalesOrderRelationship(
  client: StrivenReadOnlyClient,
  customerId: number,
  pageSize: number,
): Promise<SalesOrderRelationshipShape> {
  const salesOrdersPayload = await client.search<unknown>("/v1/sales-orders/search", {
    CustomerId: customerId,
    PageIndex: 0,
    PageSize: pageSize,
    SortExpression: "Id",
    SortOrder: 2,
  });

  const tasksPayload = await client.search<unknown>("/v1/Tasks/Search", {
    AccountID: customerId,
    PageIndex: 0,
    PageSize: pageSize,
    SortExpression: "TaskName",
    SortOrder: 2,
  });

  const salesOrderRows = rows(salesOrdersPayload);
  const taskRows = rows(tasksPayload);

  const salesOrderIds = new Set(
    salesOrderRows
      .map((row) => (typeof row.Id === "number" ? row.Id : undefined))
      .filter((id): id is number => id !== undefined),
  );

  const salesOrderRowsWithExpectedCustomer = salesOrderRows.filter(
    (row) => nestedId(row.Customer) === customerId,
  ).length;

  const taskOrderIds = taskRows
    .map((row) => {
      const direct = row.OrderId;
      if (typeof direct === "number" && direct > 0) return direct;
      return nestedId(row.SalesOrder);
    })
    .filter((id): id is number => id !== undefined && id > 0);

  const matching = taskOrderIds.filter((id) => salesOrderIds.has(id)).length;

  return {
    salesOrders: summarizePayloadShape(salesOrdersPayload),
    tasks: summarizePayloadShape(tasksPayload),
    evidence: {
      salesOrdersReturned: salesOrderRows.length,
      salesOrderRowsWithExpectedCustomer,
      tasksReturned: taskRows.length,
      tasksWithSalesOrderReference: taskOrderIds.length,
      taskSalesOrderReferencesFoundInCustomerOrders: matching,
      taskSalesOrderReferencesOutsideCustomerOrders: taskOrderIds.length - matching,
    },
  };
}
