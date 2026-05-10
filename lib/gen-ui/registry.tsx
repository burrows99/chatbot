import type { ReactNode } from "react";
import { Fragment } from "react";
import { DataGridComponent } from "@/components/chat/data-grid";
import { GanttChartComponent } from "@/components/chat/gantt-chart";
import { KanbanBoardComponent } from "@/components/chat/kanban-board";
import { CanvasEntity } from "@/lib/er/canvas-entity";
import { GitHubSearchIssuesToolResult } from "@/lib/er/github/github-search-issues.tool.result";

export type CanvasView = "grid" | "kanban" | "gantt";

type ViewRenderer<TEntity> = (entity: TEntity) => ReactNode;

type RegistryEntry<TEntity> = {
  matches: (toolName: string) => boolean;
  build: (output: unknown) => TEntity;
  views: Partial<Record<CanvasView, ViewRenderer<TEntity>>>;
};

function unwrapMcpOutput(output: unknown): unknown {
  if (!output || typeof output !== "object") {
    return output;
  }
  const envelope = output as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const first = Array.isArray(envelope.content) ? envelope.content[0] : null;
  if (first?.type === "text" && typeof first.text === "string") {
    try {
      return JSON.parse(first.text);
    } catch {
      return output;
    }
  }
  return output;
}

export class GenUIRegistry {
  private readonly entries: RegistryEntry<unknown>[] = [];

  register<TEntity>(entry: RegistryEntry<TEntity>): this {
    this.entries.push(entry as RegistryEntry<unknown>);
    return this;
  }

  /**
   * Look up the renderer for `toolName`, build the entity from `output`, and
   * return the requested views stacked in order. Returns null when no
   * renderer matches or none of the requested views are registered.
   */
  render(
    toolName: string,
    output: unknown,
    views: CanvasView[]
  ): ReactNode | null {
    const entry = this.entries.find((e) => e.matches(toolName));
    if (!entry) {
      return null;
    }
    const entity = entry.build(output);
    const nodes: ReactNode[] = [];
    for (const view of views) {
      const renderer = entry.views[view];
      if (renderer) {
        nodes.push(<Fragment key={view}>{renderer(entity)}</Fragment>);
      }
    }
    if (nodes.length === 0) {
      return null;
    }
    return <div className="flex w-full min-w-0 flex-col gap-6">{nodes}</div>;
  }
}

export const genUIRegistry =
  new GenUIRegistry().register<GitHubSearchIssuesToolResult>({
    matches: (toolName) => toolName.endsWith("search_issues"),
    build: (output) =>
      CanvasEntity.fromRaw(
        GitHubSearchIssuesToolResult,
        unwrapMcpOutput(output)
      ),
    views: {
      grid: (entity) => <DataGridComponent {...entity.dataGridProps} />,
      kanban: (entity) => <KanbanBoardComponent {...entity.kanbanBoardProps} />,
      gantt: (entity) => <GanttChartComponent {...entity.ganttChartProps} />,
    },
  });
