import {
  EMPTY_MCP_CONFIG,
  MCP_CONFIG_COOKIE,
  type McpConfig,
  parseMcpConfig,
} from "./config";

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) {
    return;
  }
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return;
}

export function getMcpConfigFromRequest(request: Request): McpConfig {
  const raw = readCookie(request, MCP_CONFIG_COOKIE);
  if (!raw) {
    return EMPTY_MCP_CONFIG;
  }
  const parsed = parseMcpConfig(raw);
  return parsed.ok ? parsed.config : EMPTY_MCP_CONFIG;
}
