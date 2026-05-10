"use client";

import type { DynamicToolUIPart } from "ai";
import { PanelRightIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
import { CanvasEntity } from "@/lib/er/canvas-entity";
import { GitHubSearchIssuesToolResult } from "@/lib/er/github/github-search-issues-tool-result";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { DataGridComponent } from "./data-grid";
import { KanbanBoardComponent } from "./kanban-board";

type CanvasView = "grid" | "kanban";

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

type CanvasRenderDataPart = {
  type: "data-canvas-render";
  data: { sourceToolName: string; views?: CanvasView[] };
};

type CanvasRenderRequest = {
  sourceToolName: string;
  views: CanvasView[];
};

function findLatestCanvasRenderData(
  messages: ChatMessage[]
): CanvasRenderRequest | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i].parts ?? [];
    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j] as { type?: string };
      if (part.type !== "data-canvas-render") {
        continue;
      }
      const dataPart = part as unknown as CanvasRenderDataPart;
      if (typeof dataPart.data?.sourceToolName === "string") {
        const requested = Array.isArray(dataPart.data.views)
          ? dataPart.data.views
          : [];
        const views = Array.from(
          new Set(requested.filter((v) => v === "grid" || v === "kanban"))
        );
        return {
          sourceToolName: dataPart.data.sourceToolName,
          views: views.length > 0 ? views : ["grid"],
        };
      }
    }
  }
  return null;
}

function findSourceOutput(
  messages: ChatMessage[],
  toolName: string
): unknown | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i].parts ?? [];
    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j] as { type?: string };
      if (part.type !== "dynamic-tool") {
        continue;
      }
      const dyn = part as DynamicToolUIPart;
      if (dyn.state !== "output-available") {
        continue;
      }
      if (dyn.toolName === toolName) {
        return dyn.output;
      }
    }
  }
  return null;
}

function renderSource(
  toolName: string,
  output: unknown,
  views: CanvasView[]
) {
  if (!toolName.endsWith("search_issues")) {
    return null;
  }
  const result = CanvasEntity.fromRaw(
    GitHubSearchIssuesToolResult,
    unwrapMcpOutput(output)
  );
  return (
    <div className="flex w-full flex-col gap-6">
      {views.map((view) => {
        if (view === "kanban") {
          return (
            <KanbanBoardComponent key={view} {...result.kanbanBoardProps} />
          );
        }
        return <DataGridComponent key={view} {...result.dataGridProps} />;
      })}
    </div>
  );
}

export function GenUICanvas({
  messages,
  onClose,
}: {
  messages: ChatMessage[];
  onClose: () => void;
}) {
  const rendered = useMemo(() => {
    const request = findLatestCanvasRenderData(messages);
    if (!request) {
      return null;
    }
    const output = findSourceOutput(messages, request.sourceToolName);
    if (output == null) {
      return null;
    }
    return renderSource(request.sourceToolName, output, request.views);
  }, [messages]);

  return (
    <div className="flex h-full flex-col" data-testid="gen-ui-canvas">
      <div
        className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4"
        data-testid="gen-ui-canvas-header"
      >
        <div className="flex items-center gap-2">
          <PanelRightIcon className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">Generated UI</span>
        </div>
        <Button
          data-testid="gen-ui-canvas-close"
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      <div
        className="min-h-0 flex-1 overflow-auto p-4"
        data-testid="gen-ui-canvas-content"
      >
        {rendered}
      </div>
    </div>
  );
}

export function GenUIToggleButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn(isActive && "bg-muted text-foreground")}
      data-testid="gen-ui-toggle"
      onClick={onClick}
      size="icon-sm"
      title="Toggle Generated UI panel"
      variant="ghost"
    >
      <PanelRightIcon className="size-4" />
    </Button>
  );
}
