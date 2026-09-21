import assert from "node:assert/strict";
import test from "node:test";
import { discoverTaskTypeSchemas } from "../src/discovery/task-schema.js";

test("discovers every Task Type custom-field definition endpoint", async () => {
  const paths: string[] = [];
  const client = {
    async get<T>(path: string): Promise<T> {
      paths.push(path);

      if (path === "/v1/Tasks/types") {
        return {
          data: [{ taskTypeId: 0 }, { id: 10 }, { id: 20 }],
        } as T;
      }

      if (path === "/v1/Tasks/types/10/custom-fields") {
        return [{ id: 1, name: "A", fieldType: { id: 2 } }] as T;
      }

      if (path === "/v1/Tasks/types/20/custom-fields") {
        return [] as T;
      }

      throw new Error(`Unexpected path: ${path}`);
    },
  };

  const result = await discoverTaskTypeSchemas(client);

  assert.equal(result.taskTypesDiscovered, 2);
  assert.equal(result.zeroIdSentinelPresent, true);
  assert.equal(result.taskTypesInspected, 2);
  assert.equal(result.allTaskTypesInspected, true);
  assert.equal(result.taskTypesWithCustomFields, 1);
  assert.deepEqual(result.customFieldDefinitionKeys, ["fieldType", "id", "name"]);
  assert.deepEqual(paths, [
    "/v1/Tasks/types",
    "/v1/Tasks/types/10/custom-fields",
    "/v1/Tasks/types/20/custom-fields",
  ]);
});

test("fails closed when Task Type discovery exceeds the configured inspection cap", async () => {
  const client = {
    async get<T>(path: string): Promise<T> {
      if (path === "/v1/Tasks/types") {
        return [{ taskTypeId: 0 }, { id: 1 }, { id: 2 }, { id: 3 }] as T;
      }

      return [] as T;
    },
  };

  const result = await discoverTaskTypeSchemas(client, 2);
  assert.equal(result.taskTypesDiscovered, 3);
  assert.equal(result.zeroIdSentinelPresent, true);
  assert.equal(result.taskTypesInspected, 2);
  assert.equal(result.allTaskTypesInspected, false);
});

test("fails closed when a Task Type has no stable ID", async () => {
  const client = {
    async get<T>(): Promise<T> {
      return [{ id: 1 }, { name: "Missing ID" }] as T;
    },
  };

  await assert.rejects(
    () => discoverTaskTypeSchemas(client),
    /stable numeric ID/,
  );
});
