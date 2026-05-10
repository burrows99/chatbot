import type { UIMessageStreamWriter } from "ai";
import { canvas } from "@/lib/gen-ui/canvas";
import type { ChatMessage } from "@/lib/types";

export type {
  CanvasOutput,
  CanvasRenderResult,
} from "@/lib/gen-ui/canvas";

export function makeCanvasTool(
  writer: UIMessageStreamWriter<ChatMessage>,
  loadedToolNames: string[]
) {
  return canvas.buildTool(writer, loadedToolNames);
}
