import assert from "node:assert/strict";
import test from "node:test";
import { probeSalesOrderRelationship } from "../src/discovery/sales-orders.js";

test("Sales Order relationship probe compares customer orders to Task order references", async () => {
  const client = {
    async search<T>(path: string): Promise<T> {
      if (path === "/v1/sales-orders/search") {
        return {
          Data: [
            { Id: 101, Customer: { Id: 77 } },
            { Id: 102, Customer: { Id: 77 } },
          ],
        } as T;
      }

      if (path === "/v1/Tasks/Search") {
        return {
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
        return { data: [{ id: 301, customerId: 88 }] } as T;
      }

      return { data: [{ id: 401, salesOrderId: 301 }] } as T;
    },
  };

  const result = await probeSalesOrderRelationship(client, 88, 1);
  assert.equal(result.evidence.salesOrderRowsWithExpectedCustomer, 1);
  assert.equal(result.evidence.taskSalesOrderReferencesFoundInCustomerOrders, 1);
});
