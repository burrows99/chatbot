import { type ModelMessage, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";
import { ToolResultLocator } from "./locator";
import { type CanvasComponent, CanvasRegistry } from "./registry";
import { CanvasStore } from "./store";
import type {
  CanvasOutput,
  CanvasRenderResult,
  CanvasTransformer,
} from "./types";

const blockSchema = z.object({
  tool: z
    .string()
    .describe(
      "Tool name whose latest call result in this turn should be rendered (e.g. 'github__list_issues')."
    ),
  renders: z
    .array(z.string())
    .min(1)
    .describe(
      "Component names from the registry to render the tool's result with. Each name produces one component via its registered transformer."
    ),
});

// Canvas orchestrates the gen UI panel: bindings (registry), client-side
// reactive state (store), and message-search (locator). Server-side it builds
// the AI SDK `canvas` tool that projects prior tool-results into renderable
// components and pushes them to the store via a `data-canvas` event.
export class Canvas {
  readonly registry = new CanvasRegistry();
  readonly store = new CanvasStore();
  readonly locator = new ToolResultLocator();

  // Bind a tool to one or more component renderers. The mapping reads as
  // "when this tool's result is rendered, here's how to transform it for each
  // component shape" — a single tool can fan out to multiple components, each
  // with its own transformer.
  bind(
    toolName: string,
    transformers: Record<string, CanvasTransformer>
  ): this {
    for (const [componentName, transformer] of Object.entries(transformers)) {
      this.registry.register(toolName, componentName, transformer);
    }
    return this;
  }

  registerComponent(componentName: string, component: CanvasComponent): this {
    this.registry.registerComponent(componentName, component);
    return this;
  }

  // Server-side projection: find the latest tool-result for `toolName` in
  // `messages`, run each render's transformer, return entries (with errors
  // surfaced inline as { error } so partial results still render).
  project(
    toolName: string,
    renders: string[],
    messages: ModelMessage[]
  ): CanvasRenderResult[] {
    const components: CanvasRenderResult[] = [];

    if (!this.registry.hasTool(toolName)) {
      components.push({
        error: `No render transformers registered for "${toolName}".`,
      });
      return components;
    }

    const result = this.locator.findLatest(messages, toolName);
    if (result === null) {
      components.push({
        error: `No prior tool-call result found for "${toolName}" in this turn. Call the tool first, then call canvas.`,
      });
      return components;
    }

    for (const renderName of renders) {
      const transformer = this.registry.getTransformer(toolName, renderName);
      if (!transformer) {
        components.push({
          error: `No transformer registered for "${toolName}" → "${renderName}".`,
        });
        continue;
      }
      try {
        const props = transformer(result);
        components.push({ component: renderName, props });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        components.push({
          error: `Transformer "${toolName}" → "${renderName}" failed: ${message}`,
        });
      }
    }

    return components;
  }

  // Builds the AI SDK `canvas` tool wired to this canvas.
  buildTool(
    writer: UIMessageStreamWriter<ChatMessage>,
    loadedToolNames: string[]
  ) {
    const bindings = this.registry.describe(loadedToolNames);

    return tool({
      description: [
        "Render the result of a previous tool call in the generative UI panel.",
        "",
        "Two-step pattern — call this AFTER the tool whose result you want to visualize:",
        "1. Call the underlying tool (e.g. `github__list_issues`) with whatever args it needs.",
        "2. Call `canvas` with `{ blocks: [{ tool: <same tool name>, renders: [<component name>] }] }`.",
        "",
        "Canvas looks up the latest result of the named tool in this turn's message history,",
        "runs the registered transformer, and renders the components in the panel.",
        "",
        "Only `tool` + `renders` combinations that appear in the bindings below will produce a render — anything else surfaces an error chip.",
        "",
        "Available bindings (tool → renderable components):",
        bindings,
      ].join("\n"),
      inputSchema: z.object({
        blocks: z
          .array(blockSchema)
          .min(1)
          .describe("Ordered list of (prior-tool-result → render) bindings."),
      }),
      execute: ({ blocks }, { toolCallId, messages }): CanvasOutput => {
        const components: CanvasRenderResult[] = [];
        for (const block of blocks) {
          components.push(...this.project(block.tool, block.renders, messages));
        }

        writer.write({
          type: "data-canvas",
          data: { toolCallId, components },
          transient: true,
        });

        return { components };
      },
    });
  }
}
