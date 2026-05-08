import { expect, test } from "@playwright/test";
import { MCP_TEST_URL } from "../helpers/mcp-test-config";

// /api/mcp/probe is gated by the same guest-session middleware as the rest of
// /api/* — visit "/" first so Playwright's request context inherits the
// guest cookie before hitting the route.
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("/api/mcp/probe", () => {
  test("returns ok and tool list for a reachable MCP server", async ({
    page,
  }) => {
    const response = await page.request.post("/api/mcp/probe", {
      data: { url: MCP_TEST_URL },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.tools)).toBe(true);
    const toolNames = body.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("echo");
  });

  test("returns ok:false with error when server is unreachable", async ({
    page,
  }) => {
    const response = await page.request.post("/api/mcp/probe", {
      data: { url: "http://127.0.0.1:1/mcp" },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });

  test("returns 400 when url is missing", async ({ page }) => {
    const response = await page.request.post("/api/mcp/probe", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });
});
