import { expect, test } from "@playwright/test";
import { EMPTY_MCP_CONFIG, MCP_CONFIG_COOKIE } from "@/lib/ai/mcp/config";
import { getMcpConfigFromRequest } from "@/lib/ai/mcp/request";
import { MCP_TEST_URL } from "../helpers/mcp-test-config";

function makeRequest(cookieValue?: string): Request {
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set(
      "cookie",
      `${MCP_CONFIG_COOKIE}=${encodeURIComponent(cookieValue)}`
    );
  }
  return new Request("http://localhost/api/chat", { headers });
}

test.describe("getMcpConfigFromRequest", () => {
  test("returns empty config when no cookie is present", () => {
    const config = getMcpConfigFromRequest(makeRequest());
    expect(config).toEqual(EMPTY_MCP_CONFIG);
  });

  test("returns parsed config when a valid cookie is present", () => {
    const value = JSON.stringify({
      mcpServers: { tester: { type: "http", url: MCP_TEST_URL } },
    });
    const config = getMcpConfigFromRequest(makeRequest(value));
    expect(config.mcpServers.tester?.url).toBe(MCP_TEST_URL);
  });

  test("returns empty config when the cookie value is malformed", () => {
    const config = getMcpConfigFromRequest(makeRequest("{ not json"));
    expect(config).toEqual(EMPTY_MCP_CONFIG);
  });

  test("returns empty config when schema validation fails", () => {
    const config = getMcpConfigFromRequest(
      makeRequest(JSON.stringify({ mcpServers: { broken: { headers: {} } } }))
    );
    expect(config).toEqual(EMPTY_MCP_CONFIG);
  });
});
