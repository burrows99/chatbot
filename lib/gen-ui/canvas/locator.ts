import type { ModelMessage } from "ai";

// Searches a message list for prior tool-call results. Stateless; lives on
// Canvas so the projection step can find the result of an MCP tool call the
// model already made earlier in the same turn.
export class ToolResultLocator {
  // Walk messages backward, find the most recent tool-result whose toolName matches.
  // Returns the unwrapped output value (AI SDK v5 wraps as `{ type, value }`)
  // or `null` if no matching result is present.
  findLatest(messages: ModelMessage[], toolName: string): unknown | null {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "tool" || !Array.isArray(msg.content)) {
        continue;
      }
      for (let j = msg.content.length - 1; j >= 0; j--) {
        const part = msg.content[j] as {
          type?: string;
          toolName?: string;
          output?: unknown;
        };
        if (part?.type === "tool-result" && part.toolName === toolName) {
          return ToolResultLocator.unwrap(part.output);
        }
      }
    }
    return null;
  }

  private static unwrap(output: unknown): unknown {
    if (
      output &&
      typeof output === "object" &&
      "value" in output &&
      (output as { value?: unknown }).value !== undefined
    ) {
      return (output as { value: unknown }).value;
    }
    return output;
  }
}
