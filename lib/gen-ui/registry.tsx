"use client";

import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { KanbanBoard } from "@/components/chat/kanban-board";
import { catalog } from "./catalog";

export const { registry } = defineRegistry(catalog, {
  components: {
    ...shadcnComponents,
    KanbanBoard: ({ props }) => <KanbanBoard {...props} />,
  },
});
