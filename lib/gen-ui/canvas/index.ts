import { Canvas } from "./canvas";
import { register as registerGithubIssues } from "./github/issues";

export { Canvas } from "./canvas";
export { ToolResultLocator } from "./locator";
export { extractMcpJson } from "./mcp-utils";
export { CanvasRegistry } from "./registry";
export { CanvasStore } from "./store";
export type {
  CanvasOutput,
  CanvasRenderResult,
  CanvasState,
  CanvasTransformer,
} from "./types";

// Singleton — every consumer (server tool factory, client canvas, data-stream
// handler) uses this same instance. Add new integrations by importing their
// `register(canvas)` and calling it below.
export const canvas = new Canvas();

registerGithubIssues(canvas);
// registerGithubProjects(canvas);
// registerJiraIssues(canvas);
