import { StrivenReadOnlyClient } from "../striven/client.js";
import { summarizePayloadShape, type PayloadShape } from "./task-search.js";

type RelationshipClient = Pick<StrivenReadOnlyClient, "search" | "get">;

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

function orderIdFromRecord(record: Record<string, unknown>): number | undefined {
  const direct = scalarId(
    record.OrderId ??
      record.OrderID ??
      record.orderId ??
      record.SalesOrderId ??
      record.SalesOrderID ??
      record.salesOrderId,
  );
  if (direct !== undefined) return direct;

  return nestedId(
    record.SalesOrder ??
      record.salesOrder ??
      record.Order ??
      record.order,
  );
}

interface PagedSearchResult {
  firstPayload: unknown;
  allRows: Array<Record<string, unknown>>;
}

async function searchAll(
  client: RelationshipClient,
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
    taskDetailsInspected: number;
    taskDetailsTruncated: boolean;
    tasksWithSalesOrderReference: number;
    taskSalesOrderReferencesFoundInCustomerOrders: number;
    taskSalesOrderReferencesOutsideCustomerOrders: number;
  };
}

export async function probeSalesOrderRelationship(
  client: RelationshipClient,
  customerId: number,
  pageSize: number,
  maxTaskDetails = 25,
): Promise<SalesOrderRelationshipShape> {
  if (!Number.isInteger(maxTaskDetails) || maxTaskDetails <= 0) {
    throw new Error("maxTaskDetails must be a positive integer");
  }

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

  const taskIds = taskRows
    .map(rowId)
    .filter((id): id is number => id !== undefined);

  const directSearchOrderIds = taskRows
    .map(orderIdFromRecord)
    .filter((id): id is number => id !== undefined);

  const detailOrderIds: number[] = [];
  const detailTaskIds = taskIds.slice(0, maxTaskDetails);

  for (const taskId of detailTaskIds) {
    const detail = await client.get<unknown>(`/v1/Tasks/${taskId}`);
    if (!detail || typeof detail !== "object" || Array.isArray(detail)) continue;

    const orderId = orderIdFromRecord(detail as Record<string, unknown>);
    if (orderId !== undefined) {
      detailOrderIds.push(orderId);
    }
  }

  const taskOrderIds = [...new Set([...directSearchOrderIds, ...detailOrderIds])];
  const matching = taskOrderIds.filter((id) => salesOrderIds.has(id)).length;

  return {
    salesOrders: summarizePayloadShape(salesOrders.firstPayload),
    tasks: summarizePayloadShape(tasks.firstPayload),
    evidence: {
      salesOrdersReturned: salesOrderRows.length,
      salesOrderRowsWithExpectedCustomer,
      tasksReturned: taskRows.length,
      taskDetailsInspected: detailTaskIds.length,
      taskDetailsTruncated: taskIds.length > maxTaskDetails,
      tasksWithSalesOrderReference: taskOrderIds.length,
      taskSalesOrderReferencesFoundInCustomerOrders: matching,
      taskSalesOrderReferencesOutsideCustomerOrders: taskOrderIds.length - matching,
    },
  };
}
