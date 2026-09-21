import assert from "node:assert/strict";
import test from "node:test";
import { probeSalesOrderRelationship } from "../src/discovery/sales-orders.js";

test("Sales Order relationship probe compares customer orders to Task order references", async () => {
  const client = {
    async search<T>(path: string): Promise<T> {
      if (path === "/v1/sales-orders/search") {
        return {
          TotalCount: 2,
          Data: [
            { Id: 101, Customer: { Id: 77 } },
            { Id: 102, Customer: { Id: 77 } },
          ],
        } as T;
      }

      if (path === "/v1/Tasks/Search") {
        return {
          TotalCount: 3,
          Data: [
            { Id: 201, OrderId: 101 },
            { Id: 202, SalesOrder: { Id: 999 } },
            { Id: 203 },
          ],
        } as T;
      }

      throw new Error(`Unexpected path: ${path}`);
    },
  };

  const result = await probeSalesOrderRelationship(client, 77, 10);

  assert.deepEqual(result.evidence, {
    salesOrdersReturned: 2,
    salesOrderRowsWithExpectedCustomer: 2,
    tasksReturned: 3,
    tasksWithSalesOrderReference: 2,
    taskSalesOrderReferencesFoundInCustomerOrders: 1,
    taskSalesOrderReferencesOutsideCustomerOrders: 1,
  });
});

test("Sales Order relationship probe supports lowercase response envelopes", async () => {
  const client = {
    async search<T>(path: string): Promise<T> {
      if (path === "/v1/sales-orders/search") {
        return { totalCount: 1, data: [{ id: 301, customerId: 88 }] } as T;
      }

      return { totalCount: 1, data: [{ id: 401, salesOrderId: 301 }] } as T;
    },
  };

  const result = await probeSalesOrderRelationship(client, 88, 1);
  assert.equal(result.evidence.salesOrderRowsWithExpectedCustomer, 1);
  assert.equal(result.evidence.taskSalesOrderReferencesFoundInCustomerOrders, 1);
});

test("Sales Order relationship probe includes later pages before resolving Task references", async () => {
  const calls: Array<{ path: string; pageIndex: number }> = [];

  const client = {
    async search<T>(path: string, body: Record<string, unknown>): Promise<T> {
      const pageIndex = Number(body.PageIndex ?? 0);
      calls.push({ path, pageIndex });

      if (path === "/v1/sales-orders/search") {
        return {
          totalCount: 2,
          data:
            pageIndex === 0
              ? [{ id: 501, customerId: 99 }]
              : [{ id: 502, customerId: 99 }],
        } as T;
      }

      if (path === "/v1/Tasks/Search") {
        return {
          totalCount: 1,
          data: [{ id: 601, salesOrderId: 502 }],
        } as T;
      }

      throw new Error(`Unexpected path: ${path}`);
    },
  };

  const result = await probeSalesOrderRelationship(client, 99, 1);

  assert.equal(result.evidence.salesOrdersReturned, 2);
  assert.equal(result.evidence.taskSalesOrderReferencesFoundInCustomerOrders, 1);
  assert.ok(
    calls.some(
      (call) => call.path === "/v1/sales-orders/search" && call.pageIndex === 1,
    ),
  );
});
