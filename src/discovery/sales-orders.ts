import { StrivenReadOnlyClient } from "../striven/client.js";
import { summarizePayloadShape, type PayloadShape } from "./task-search.js";

type SearchClient = Pick<StrivenReadOnlyClient, "search">;

function rows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter(
      (row): row is Record<string, unknown> =>
        Boolean(row) && typeof row === "object" && !Array.isArray(row),
    );
  }

  if (!payload || typeof payload !== "object") return [];

  const envelope = payload as Record<string, unknown>;
  const candidates = [envelope.Data, envelope.data, envelope.Items, envelope.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (row): row is Record<string, unknown> =>
          Boolean(row) && typeof row === "object" && !Array.isArray(row),
      );
    }
  }

  return [];
}

function scalarId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10);
    return parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function nestedId(value: unknown): number | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const object = value as Record<string, unknown>;
  return scalarId(object.Id ?? object.ID ?? object.id);
}

function rowId(row: Record<string, unknown>): number | undefined {
  return scalarId(row.Id ?? row.ID ?? row.id);
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
  client: SearchClient,
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
      .map(rowId)
      .filter((id): id is number => id !== undefined),
  );

  const salesOrderRowsWithExpectedCustomer = salesOrderRows.filter((row) => {
    const directCustomerId = scalarId(row.CustomerId ?? row.CustomerID ?? row.customerId);
    const nestedCustomerId = nestedId(row.Customer ?? row.customer);
    return directCustomerId === customerId || nestedCustomerId === customerId;
  }).length;

  const taskOrderIds = taskRows
    .map((row) => {
      const direct =
        scalarId(row.OrderId ?? row.OrderID ?? row.SalesOrderId ?? row.SalesOrderID);
      if (direct !== undefined) return direct;
      return nestedId(row.SalesOrder ?? row.salesOrder ?? row.Order ?? row.order);
    })
    .filter((id): id is number => id !== undefined);

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
