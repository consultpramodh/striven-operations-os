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

function nonNegativeInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10);
    return parsed >= 0 ? parsed : undefined;
  }
  return undefined;
}

function totalCount(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const object = payload as Record<string, unknown>;
  return nonNegativeInteger(
    object.TotalCount ??
      object.totalCount ??
      object.Total ??
      object.total ??
      object.Count ??
      object.count,
  );
}

function nestedId(value: unknown): number | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const object = value as Record<string, unknown>;
  return scalarId(object.Id ?? object.ID ?? object.id);
}

function rowId(row: Record<string, unknown>): number | undefined {
  return scalarId(row.Id ?? row.ID ?? row.id);
}

interface PagedSearchResult {
  firstPayload: unknown;
  allRows: Array<Record<string, unknown>>;
}

async function searchAll(
  client: SearchClient,
  path: string,
  baseBody: Record<string, unknown>,
  pageSize: number,
  maxPages = 20,
): Promise<PagedSearchResult> {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error("pageSize must be a positive integer");
  }

  let firstPayload: unknown = null;
  const allRows: Array<Record<string, unknown>> = [];

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const payload = await client.search<unknown>(path, {
      ...baseBody,
      PageIndex: pageIndex,
      PageSize: pageSize,
    });

    if (pageIndex === 0) firstPayload = payload;

    const pageRows = rows(payload);
    allRows.push(...pageRows);

    const expectedTotal = totalCount(payload);
    if (expectedTotal !== undefined && allRows.length >= expectedTotal) {
      return { firstPayload, allRows };
    }

    if (pageRows.length === 0 || pageRows.length < pageSize) {
      return { firstPayload, allRows };
    }
  }

  throw new Error(`Pagination safety cap reached for ${path}`);
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
  const salesOrders = await searchAll(
    client,
    "/v1/sales-orders/search",
    {
      CustomerId: customerId,
      SortExpression: "Id",
      SortOrder: 2,
    },
    pageSize,
  );

  const tasks = await searchAll(
    client,
    "/v1/Tasks/Search",
    {
      AccountID: customerId,
      SortExpression: "TaskName",
      SortOrder: 2,
    },
    pageSize,
  );

  const salesOrderRows = salesOrders.allRows;
  const taskRows = tasks.allRows;

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
      const direct = scalarId(
        row.OrderId ??
          row.OrderID ??
          row.orderId ??
          row.SalesOrderId ??
          row.SalesOrderID ??
          row.salesOrderId,
      );
      if (direct !== undefined) return direct;
      return nestedId(row.SalesOrder ?? row.salesOrder ?? row.Order ?? row.order);
    })
    .filter((id): id is number => id !== undefined);

  const matching = taskOrderIds.filter((id) => salesOrderIds.has(id)).length;

  return {
    salesOrders: summarizePayloadShape(salesOrders.firstPayload),
    tasks: summarizePayloadShape(tasks.firstPayload),
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
