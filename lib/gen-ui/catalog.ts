import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { dataGridDefinition } from "./components/data-grid";
import { kanbanBoardDefinition } from "./components/kanban";

export const catalog = defineCatalog(schema, {
  components: {
    ...shadcnComponentDefinitions,
    KanbanBoard: kanbanBoardDefinition,
    DataGrid: dataGridDefinition,
  },
  actions: {},
});
