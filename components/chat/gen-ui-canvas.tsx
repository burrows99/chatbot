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
  data: { sourceToolName: string };
};

function findLatestCanvasRenderData(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i].parts ?? [];
    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j] as { type?: string };
      if (part.type !== "data-canvas-render") {
        continue;
      }
      const dataPart = part as unknown as CanvasRenderDataPart;
      if (typeof dataPart.data?.sourceToolName === "string") {
        return dataPart.data.sourceToolName;
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

function renderSource(toolName: string, output: unknown) {
  if (toolName.endsWith("search_issues")) {
    const result = CanvasEntity.fromRaw(
      GitHubSearchIssuesToolResult,
      unwrapMcpOutput(output)
    );
    return <DataGridComponent {...result.dataGridProps} />;
  }
  return null;
}

export function GenUICanvas({
  messages,
  onClose,
}: {
  messages: ChatMessage[];
  onClose: () => void;
}) {
  const rendered = useMemo(() => {
    const sourceToolName = findLatestCanvasRenderData(messages);
    if (!sourceToolName) {
      return null;
    }
    const output = findSourceOutput(messages, sourceToolName);
    if (output == null) {
      return null;
    }
    return renderSource(sourceToolName, output);
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
