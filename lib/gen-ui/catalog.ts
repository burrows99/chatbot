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
        "A draggable Kanban board for task or issue tracking. Organises items into columns (e.g. todo / in_progress / done). Each item has a `column` field matching a column `id`. Use for boards, backlogs, sprint views, or any grouped-by-status data. Use as root or as a tab pane inside Tabs for multi-view layouts. Map issue state: open→todo, in_progress→in_progress, closed→done.",
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
        "A sortable, paginated data table. Use for lists, search results, or any tabular dataset. 'columns' defines headers — each 'key' must match a field in the row objects. Supported column types: text, number, date, badge, link (set hrefKey to the field containing the URL). Use as root or as a tab pane inside Tabs for multi-view layouts.",
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
