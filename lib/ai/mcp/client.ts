import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import type { ToolSet } from "ai";
import type { McpConfig, McpServerConfig } from "./config";

function transportFor(server: McpServerConfig) {
  if (server.type === "sse") {
    return { type: "sse" as const, url: server.url, headers: server.headers };
  }
  return { type: "http" as const, url: server.url, headers: server.headers };
}

export function openMcpClient(server: McpServerConfig): Promise<MCPClient> {
  return createMCPClient({ transport: transportFor(server) });
}

export type ProbeResult =
  | { ok: true; tools: { name: string; description?: string }[] }
  | { ok: false; error: string };

export async function probeMcpServer(
  server: McpServerConfig
): Promise<ProbeResult> {
  let client: MCPClient | undefined;
  try {
    client = await openMcpClient(server);
    const list = await client.listTools();
    return {
      ok: true,
      tools: list.tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  } finally {
    await client?.close().catch(() => undefined);
  }
}

export type LoadedMcpTools = {
  tools: ToolSet;
  close: () => Promise<void>;
};

export async function loadMcpTools(config: McpConfig): Promise<LoadedMcpTools> {
  const clients: MCPClient[] = [];
  const merged: ToolSet = {};

  for (const [name, server] of Object.entries(config.mcpServers)) {
    try {
      const client = await openMcpClient(server);
      clients.push(client);
      const set = await client.tools();
      for (const [toolName, tool] of Object.entries(set)) {
        // Prefix with server name to avoid collisions across servers.
        merged[`${name}__${toolName}`] = tool as ToolSet[string];
      }
    } catch (err) {
      // Skip servers that fail to connect — surface error in logs but keep
      // the chat usable with whatever tools loaded successfully.
      console.warn(`MCP server "${name}" failed to load:`, err);
    }
  }

  return {
    tools: merged,
    close: async () => {
      await Promise.allSettled(clients.map((c) => c.close()));
    },
  };
}
