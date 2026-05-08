import { createServer, type Server } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export type McpTestServerHandle = {
  url: string;
  stop: () => Promise<void>;
};

function createMcpServer(): McpServer {
  const mcp = new McpServer({ name: "mcp-test-server", version: "0.0.1" });
  mcp.registerTool(
    "echo",
    {
      description: "Echo back the provided message.",
      inputSchema: { message: z.string() },
    },
    async ({ message }) => ({
      content: [{ type: "text", text: `echoed: ${message}` }],
    })
  );
  return mcp;
}

export async function startMcpTestServer(
  port: number
): Promise<McpTestServerHandle> {
  // Stateless pattern (per the official MCP SDK example): a fresh
  // McpServer + transport pair is created for every POST request, then
  // disposed when the response finishes. GET and DELETE return 405.
  const httpServer: Server = createServer(async (req, res) => {
    if (!req.url?.startsWith("/mcp")) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32_000, message: "Method not allowed" },
          id: null,
        })
      );
      return;
    }

    const mcp = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close().catch(() => undefined);
      mcp.close().catch(() => undefined);
    });

    try {
      await mcp.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain");
        res.end(String(err));
      }
    }
  });

  await new Promise<void>((resolve) =>
    httpServer.listen(port, "127.0.0.1", resolve)
  );

  return {
    url: `http://127.0.0.1:${port}/mcp`,
    stop: async () => {
      await new Promise<void>((resolve, reject) =>
        httpServer.close((err) => (err ? reject(err) : resolve()))
      );
    },
  };
}
