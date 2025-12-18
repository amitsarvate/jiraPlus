import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnoseJiraUnauthorized } from "./jiraSync";

const logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

test("diagnoseJiraUnauthorized reports agile permission when core API succeeds", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () =>
    new Response(JSON.stringify({ accountId: "acc-1" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

  const result = await diagnoseJiraUnauthorized({
    cloudId: "cloud-1",
    accessToken: "token",
    logger
  });

  assert.equal(result.reason, "agile-permission");
});

test("diagnoseJiraUnauthorized reports token unauthorized on 401", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => new Response("Unauthorized", { status: 401 });

  const result = await diagnoseJiraUnauthorized({
    cloudId: "cloud-1",
    accessToken: "token",
    logger
  });

  assert.equal(result.reason, "token-unauthorized");
});

test("diagnoseJiraUnauthorized reports unknown on non-auth errors", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => new Response("Server error", { status: 500 });

  const result = await diagnoseJiraUnauthorized({
    cloudId: "cloud-1",
    accessToken: "token",
    logger
  });

  assert.equal(result.reason, "unknown");
  assert.match(result.message, /500/);
});
