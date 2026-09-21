import assert from "node:assert/strict";
import test from "node:test";
import { StrivenTokenManager } from "../src/striven/auth.js";
import { StrivenReadOnlyClient } from "../src/striven/client.js";
import { ApiMeter } from "../src/striven/metrics.js";

test("Stage 0 blocks POST to anything other than a Search endpoint before network access", async () => {
  const tokens = new StrivenTokenManager("https://api.striven.test", "id", "secret");
  const client = new StrivenReadOnlyClient(
    "https://api.striven.test",
    tokens,
    new ApiMeter(),
  );

  await assert.rejects(
    () => client.search("/v1/Tasks", { TaskName: "must-not-run" }),
    /blocked POST to non-search endpoint/i,
  );
});

test("Stage 0 accepts an explicit Search path at the boundary", async () => {
  const originalFetch = globalThis.fetch;
  const seen: Array<{ url: string; method: string; body: string | null }> = [];

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith("/accesstoken")) {
      return new Response(
        JSON.stringify({ access_token: "test-token", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    seen.push({
      url,
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : null,
    });

    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const client = new StrivenReadOnlyClient(
      "https://api.striven.test",
      new StrivenTokenManager("https://api.striven.test", "id", "secret"),
      new ApiMeter(),
    );

    await client.search("/v1/Tasks/Search", { AccountID: 123 });

    assert.equal(seen.length, 1);
    assert.equal(seen[0]?.method, "POST");
    assert.equal(seen[0]?.url, "https://api.striven.test/v1/Tasks/Search");
    assert.deepEqual(JSON.parse(seen[0]?.body ?? "{}"), { AccountID: 123 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
