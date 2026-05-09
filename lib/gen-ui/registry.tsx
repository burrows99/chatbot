"use client";

import { type ComponentFn, defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { DataGridComponent } from "@/components/chat/data-grid-component";
import { KanbanBoard } from "@/components/chat/kanban-board";
import { catalog } from "./catalog";

const KanbanBoardRenderer: ComponentFn<typeof catalog, "KanbanBoard"> = ({
  props,
}) => <KanbanBoard {...props} />;

const DataGridRenderer: ComponentFn<typeof catalog, "DataGrid"> = ({
  props,
}) => <DataGridComponent {...props} />;

export const { registry } = defineRegistry(catalog, {
  components: {
    ...shadcnComponents,
    KanbanBoard: KanbanBoardRenderer,
    DataGrid: DataGridRenderer,
  },
});
