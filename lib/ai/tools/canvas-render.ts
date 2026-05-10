import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";

type CanvasRenderProps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const canvasRender = ({ dataStream }: CanvasRenderProps) =>
  tool({
    description:
      "Render a prior tool's result on the Generated UI canvas (the side panel). " +
      "Pick one or more views to stack on the canvas: 'grid' for a sortable, " +
      "paginated data table (good for many rows with comparable fields); " +
      "'kanban' for a column board grouped by status (good for issue/task " +
      "workflows); 'gantt' for a timeline of items with start/end dates (good " +
      "for showing when issues were opened and closed). Pass multiple when the " +
      "user would benefit from seeing more than one view of the same data. " +
      "Call this AFTER a data-returning tool like 'github__search_issues'.",
    inputSchema: z.object({
      sourceToolName: z
        .string()
        .describe(
          "Name of the tool whose most recent output to render on the canvas " +
            "(e.g., 'github__search_issues')."
        ),
      views: z
        .array(z.enum(["grid", "kanban", "gantt"]))
        .min(1)
        .default(["grid"])
        .describe(
          "Ordered list of visualizations to render on the canvas. " +
            "Each view renders the same source output. Duplicates are deduplicated."
        ),
    }),
    execute: (input) => {
      const views = Array.from(new Set(input.views));
      dataStream.write({
        type: "data-canvas-render",
        data: {
          sourceToolName: input.sourceToolName,
          views,
        },
      });
      return {
        ok: true,
        sourceToolName: input.sourceToolName,
        views,
      };
    },
  });
