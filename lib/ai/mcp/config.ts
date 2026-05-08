import { z } from "zod";

export const MCP_CONFIG_STORAGE_KEY = "mcp-config";
export const MCP_CONFIG_COOKIE = "mcp-config";

export const EMPTY_MCP_CONFIG: McpConfig = { mcpServers: {} };

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
