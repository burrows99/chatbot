// Registry mapping MCP tool name → component name → transformer (server-side)
// AND component name → React component (client-side). Both halves live in one
// registry so each integration file is the single source of truth for its
// MCP-tool ↔ UI binding.
//
// Tool names are the FULL prefixed MCP tool name (`<serverName>__<toolName>`).
// The prefix matches the key used in the user's mcp-config (commonly `github`).

import type { ComponentType } from "react";
import type { CanvasTransformer } from "./types";

// Component prop shapes are heterogeneous across integrations; the bridge from
// transformer output to component props is structural, not type-checked here.
// `any` is intentional — the registry is keyed by string and validated by the
// transformer ↔ component pairing, not by TS.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CanvasComponent = ComponentType<any>;

export class CanvasRegistry {
  private readonly transformers = new Map<
    string,
    Map<string, CanvasTransformer>
  >();
  private readonly components = new Map<string, CanvasComponent>();

  register(
    toolName: string,
    componentName: string,
    transformer: CanvasTransformer
  ): this {
    let bucket = this.transformers.get(toolName);
    if (!bucket) {
      bucket = new Map();
      this.transformers.set(toolName, bucket);
    }
    bucket.set(componentName, transformer);
    return this;
  }

  registerComponent(componentName: string, component: CanvasComponent): this {
    this.components.set(componentName, component);
    return this;
  }

  hasTool(toolName: string): boolean {
    return this.transformers.has(toolName);
  }

  getTransformer(
    toolName: string,
    componentName: string
  ): CanvasTransformer | undefined {
    return this.transformers.get(toolName)?.get(componentName);
  }

  getComponent(componentName: string): CanvasComponent | undefined {
    return this.components.get(componentName);
  }

  getRenders(toolName: string): string[] {
    const bucket = this.transformers.get(toolName);
    return bucket ? Array.from(bucket.keys()) : [];
  }

  getTools(): string[] {
    return Array.from(this.transformers.keys());
  }

  describe(loadedToolNames: string[]): string {
    const lines: string[] = [];
    for (const toolName of loadedToolNames) {
      const renders = this.getRenders(toolName);
      if (renders.length > 0) {
        lines.push(`- ${toolName} → ${renders.join(", ")}`);
      }
    }
    return lines.length > 0
      ? lines.join("\n")
      : "(no MCP tools currently have registered renderers)";
  }
}
