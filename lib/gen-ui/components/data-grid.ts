import { z } from "zod";

const dataGridColumnSchema = z.object({
  key: z.string(),
  header: z.string(),
  type: z.enum(["text", "link", "badge", "number", "date"]).nullable(),
  hrefKey: z.string().nullable(),
  width: z.number().nullable(),
  align: z.enum(["left", "right", "center"]).nullable(),
});

export const dataGridDefinition = {
  props: z.object({
    title: z.string().nullable(),
    columns: z.array(dataGridColumnSchema),
    rows: z.array(z.record(z.string(), z.unknown())),
    pageSize: z.number().nullable(),
  }),
  description:
    "A sortable, paginated data table. Use for lists, search results, or any tabular dataset. 'columns' defines headers — each 'key' must match a field in the row objects. Supported column types: text, number, date, badge, link (set hrefKey to the field containing the URL). Use as root or as a tab pane inside Tabs (with `visible: { $state: '/<key>', eq: '<value>' }`) for multi-view layouts.",
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
} as const;
