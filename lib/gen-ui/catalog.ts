import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";

const kanbanItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  column: z.string(),
  labels: z.array(z.string()).optional(),
  url: z.string().optional(),
});

const kanbanColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  color: z.string().optional(),
});

export const catalog = defineCatalog(schema, {
  components: {
    ...shadcnComponentDefinitions,
    KanbanBoard: {
      props: z.object({
        title: z.string().optional(),
        columns: z.array(kanbanColumnSchema).optional(),
        items: z.array(kanbanItemSchema).optional(),
      }),
      description:
        "A draggable Kanban board with columns and cards. Each item has a `column` field matching a column `id`. Default columns: todo, in_progress, done. IMPORTANT: KanbanBoard must always be the ROOT element (set /root to its key). Never nest it as a child of Card or any other component.",
      example: {
        title: "Tasks",
        columns: [
          { id: "todo", title: "To Do" },
          { id: "in_progress", title: "In Progress" },
          { id: "done", title: "Done" },
        ],
        items: [{ id: 1, title: "Example task", column: "todo" }],
      },
    },
  },
  actions: {},
});
