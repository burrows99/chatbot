import { z } from "zod";

export const MCP_CONFIG_STORAGE_KEY = "mcp-config";
export const MCP_CONFIG_COOKIE = "mcp-config";

const headersSchema = z.record(z.string(), z.string()).optional();

const httpServerSchema = z.object({
  type: z.literal("http").optional(),
  url: z.string().url(),
  headers: headersSchema,
});

const sseServerSchema = z.object({
  type: z.literal("sse"),
  url: z.string().url(),
  headers: headersSchema,
});

const serverSchema = z.union([httpServerSchema, sseServerSchema]);

export const mcpConfigSchema = z.object({
  mcpServers: z.record(z.string().min(1), serverSchema),
});

export type McpServerConfig = z.infer<typeof serverSchema>;
export type McpConfig = z.infer<typeof mcpConfigSchema>;
export type Transport = "http" | "sse";

export const EMPTY_MCP_CONFIG: McpConfig = { mcpServers: {} };

export const GITHUB_MCP_URL =
  process.env.NEXT_PUBLIC_GITHUB_MCP_URL ??
  "https://api.githubcopilot.com/mcp/";
export const ATLASSIAN_MCP_URL =
  process.env.NEXT_PUBLIC_ATLASSIAN_MCP_URL ?? "http://localhost:8888/mcp";
export const PLANNER_MCP_URL =
  process.env.NEXT_PUBLIC_PLANNER_MCP_URL ?? "http://localhost:8000/mcp";

export const DEFAULT_MCP_CONFIG: McpConfig = {
  mcpServers: {
    github: {
      type: "http",
      url: GITHUB_MCP_URL,
      headers: {
        Authorization: "Bearer github_pat_00000...",
      },
    },
    atlassian: {
      type: "http",
      url: ATLASSIAN_MCP_URL,
    },
    planner: {
      type: "http",
      url: PLANNER_MCP_URL,
    },
  },
};

export function transportOf(server: McpServerConfig): Transport {
  return server.type === "sse" ? "sse" : "http";
}

export type ParseResult =
  | { ok: true; config: McpConfig }
  | { ok: false; error: string };

export function parseMcpConfig(input: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    return { ok: false, error: message };
  }

  const result = mcpConfigSchema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".") || "config";
    return { ok: false, error: `${path}: ${first?.message ?? "invalid"}` };
  }

  return { ok: true, config: result.data };
}
