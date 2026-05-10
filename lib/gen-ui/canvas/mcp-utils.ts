// MCP CallToolResult unwrap. Accepts every shape we've seen the AI SDK pass
// through for an MCP tool's `output`:
//   - `{ content: [{ type: 'text', text: '<json>' }] }` (the canonical CallToolResult)
//   - `[{ type: 'text', text: '<json>' }]` (bare content array — what the GitHub Copilot MCP returns through @ai-sdk/mcp)
//   - `{ structuredContent: ... }` (typed-output servers)
// JSON-parses the first text block; falls back to the raw value.

function parseFirstTextBlock(blocks: unknown[]): unknown | null {
  for (const block of blocks) {
    if (
      block &&
      typeof block === "object" &&
      (block as { type?: unknown }).type === "text" &&
      typeof (block as { text?: unknown }).text === "string"
    ) {
      const text = (block as { text: string }).text;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  }
  return null;
}

export function extractMcpJson(result: unknown): unknown {
  if (!result || typeof result !== "object") {
    return result;
  }
  if (Array.isArray(result)) {
    const parsed = parseFirstTextBlock(result);
    return parsed ?? result;
  }
  const r = result as Record<string, unknown>;
  if (r.structuredContent !== undefined) {
    return r.structuredContent;
  }
  if (Array.isArray(r.content)) {
    const parsed = parseFirstTextBlock(r.content);
    if (parsed !== null) {
      return parsed;
    }
  }
  return result;
}
