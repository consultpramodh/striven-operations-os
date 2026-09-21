import assert from "node:assert/strict";
import test from "node:test";
import { discoverEntityCustomFields } from "../src/discovery/custom-fields.js";

test("native custom-field discovery normalizes definitions without business-record values", async () => {
  const client = {
    async get<T>(path: string): Promise<T> {
      assert.equal(path, "/v1/customers/0/custom-fields");
      return [
        {
          Id: 15,
          Name: "Service Region",
          FieldType: { Id: 3, Name: "Dropdown" },
          IsRequired: true,
        },
      ] as T;
    },
  };

  const fields = await discoverEntityCustomFields(client, "Customers");

  assert.equal(fields.length, 1);
  assert.equal(fields[0]?.fieldId, 15);
  assert.equal(fields[0]?.name, "Service Region");
  assert.equal(fields[0]?.dataType, "Dropdown");
  assert.equal(fields[0]?.required, true);
  assert.equal(fields[0]?.source, "native-metadata");
  assert.equal(fields[0]?.mappingStatus, "verified");
});

test("native custom-field discovery fails closed on an unexpected response shape", async () => {
  const client = {
    async get<T>(): Promise<T> {
      return { Data: [] } as T;
    },
  };

  await assert.rejects(
    () => discoverEntityCustomFields(client, "Customers"),
    /Expected array/,
  );
});
