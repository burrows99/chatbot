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

const dataGridColumnSchema = z.object({
  key: z.string(),
  header: z.string(),
  type: z.enum(["text", "link", "badge", "number", "date"]).optional(),
  hrefKey: z.string().optional(),
  width: z.number().optional(),
  align: z.enum(["left", "right", "center"]).optional(),
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
        "A draggable Kanban board with columns and cards. Each item has a `column` field matching a column `id`. Default columns: todo, in_progress, done. Designed to fill the full canvas — best used as the root element or as a tab pane inside Tabs.",
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
    DataGrid: {
      props: z.object({
        title: z.string().optional(),
        columns: z.array(dataGridColumnSchema),
        rows: z.array(z.record(z.string(), z.unknown())),
        pageSize: z.number().optional(),
      }),
      description:
        "A sortable, paginated data table. 'columns' defines the headers (key, header, type, optional hrefKey/width/align). 'rows' is an array of plain objects matching the column keys. Use type 'link' with 'hrefKey' to render clickable URLs. Use type 'number' for numeric values. Designed to fill the full canvas — best used as the root element or as a tab pane inside Tabs.",
      example: {
        title: "Issues",
        columns: [
          { key: "title", header: "Title", type: "link", hrefKey: "url" },
          { key: "state", header: "State" },
          { key: "number", header: "#", type: "number", align: "right" },
        ],
        rows: [
          {
            title: "Fix login bug",
            url: "https://github.com/...",
            state: "open",
            number: 42,
          },
        ],
      },
    },
  },
  actions: {},
});
