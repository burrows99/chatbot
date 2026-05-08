import { expect, test } from "@playwright/test";
import { loadMcpTools } from "@/lib/ai/mcp/client";
import { MCP_TEST_URL } from "../helpers/mcp-test-config";

test.describe("loadMcpTools", () => {
  test("returns AI SDK tools prefixed by server name", async () => {
    const { tools, close } = await loadMcpTools({
      mcpServers: {
        testserver: { type: "http", url: MCP_TEST_URL },
      },
    });

    try {
      const names = Object.keys(tools);
      expect(names).toContain("testserver__echo");
    } finally {
      await close();
    }
  });

  test("merges tools from multiple servers", async () => {
    const { tools, close } = await loadMcpTools({
      mcpServers: {
        a: { type: "http", url: MCP_TEST_URL },
        b: { type: "http", url: MCP_TEST_URL },
      },
    });

    try {
      const names = Object.keys(tools);
      expect(names).toContain("a__echo");
      expect(names).toContain("b__echo");
    } finally {
      await close();
    }
  });

  test("skips a failing server but still returns the rest", async () => {
    const { tools, close } = await loadMcpTools({
      mcpServers: {
        broken: { type: "http", url: "http://127.0.0.1:1/mcp" },
        good: { type: "http", url: MCP_TEST_URL },
      },
    });

    try {
      const names = Object.keys(tools);
      expect(names).toContain("good__echo");
      expect(names.some((n) => n.startsWith("broken__"))).toBe(false);
    } finally {
      await close();
    }
  });

  test("close() releases all underlying clients", async () => {
    const { tools, close } = await loadMcpTools({
      mcpServers: {
        s: { type: "http", url: MCP_TEST_URL },
      },
    });
    expect(Object.keys(tools).length).toBeGreaterThan(0);
    // Should not throw, even if called multiple times.
    await close();
    await close();
  });
});
