import { z } from "zod";

const kanbanItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable(),
  column: z.string(),
  labels: z.array(z.string()).nullable(),
  url: z.string().nullable(),
});

const kanbanColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  color: z.string().nullable(),
});

export const kanbanBoardDefinition = {
  props: z.object({
    title: z.string().nullable(),
    columns: z.array(kanbanColumnSchema).nullable(),
    items: z.array(kanbanItemSchema).nullable(),
  }),
  description:
    "A draggable Kanban board for task or issue tracking. Organises items into columns (e.g. todo / in_progress / done). Each item has a `column` field matching a column `id`. Use for boards, backlogs, sprint views, or any grouped-by-status data. Use as root or as a tab pane inside Tabs (with `visible: { $state: '/<key>', eq: '<value>' }`) for multi-view layouts. Map issue state: open→todo, in_progress→in_progress, closed→done.",
  example: {
    title: "Tasks",
    columns: [
      { id: "todo", title: "To Do" },
      { id: "in_progress", title: "In Progress" },
      { id: "done", title: "Done" },
    ],
    items: [{ id: 1, title: "Example task", column: "todo" }],
  },
} as const;
