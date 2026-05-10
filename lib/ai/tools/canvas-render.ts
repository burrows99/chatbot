import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";

type CanvasRenderProps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const canvasRender = ({ dataStream }: CanvasRenderProps) =>
  tool({
    description:
      "Render a prior tool's result on the Generated UI canvas (the side panel) " +
      "as a rich UI (e.g., a data grid for GitHub issues). " +
      "Call this AFTER a data-returning tool like 'github__search_issues' when the " +
      "user would benefit from a visual view of the data. The canvas reads the " +
      "referenced tool's most recent output from the chat history.",
    inputSchema: z.object({
      sourceToolName: z
        .string()
        .describe(
          "Name of the tool whose most recent output to render on the canvas " +
            "(e.g., 'github__search_issues')."
        ),
    }),
    execute: (input) => {
      dataStream.write({
        type: "data-canvas-render",
        data: { sourceToolName: input.sourceToolName },
      });
      return { ok: true, sourceToolName: input.sourceToolName };
    },
  });
