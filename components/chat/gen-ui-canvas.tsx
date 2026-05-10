"use client";

import {
  AlertTriangleIcon,
  type LucideIcon,
  PanelRightIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { type CanvasRenderResult, canvas } from "@/lib/gen-ui/canvas";
import { useCanvasState } from "@/lib/gen-ui/canvas/use-canvas-state";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

function EmptyState({
  icon: Icon,
  message,
  testId,
}: {
  icon: LucideIcon;
  message: string;
  testId: string;
}) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground"
      data-testid={testId}
    >
      <Icon className="size-8 opacity-40" />
      <p className="text-center text-sm">{message}</p>
    </div>
  );
}

function ErrorChip({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-amber-700 text-xs dark:text-amber-400"
      data-testid="gen-ui-canvas-error"
    >
      <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function CanvasRender({
  entry,
  index,
}: {
  entry: CanvasRenderResult;
  index: number;
}) {
  if ("error" in entry) {
    return <ErrorChip message={entry.error} />;
  }
  const Component = canvas.registry.getComponent(entry.component);
  if (!Component) {
    return (
      <ErrorChip
        message={`Unknown component "${entry.component}". Register it via registry.registerComponent(...) in an integration file.`}
      />
    );
  }
  return <Component key={`${entry.component}-${index}`} {...entry.props} />;
}

export function GenUICanvas({ onClose }: { onClose: () => void }) {
  const { components, toolCallId } = useCanvasState();

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

      {toolCallId ? (
        <div
          className="min-h-0 flex-1 overflow-y-auto p-4"
          data-testid="gen-ui-canvas-content"
        >
          {components.length > 0 ? (
            <div className="flex flex-col gap-4">
              {components.map((entry, index) => (
                <CanvasRender
                  entry={entry}
                  index={index}
                  key={
                    "error" in entry
                      ? `error-${index}`
                      : `${entry.component}-${index}`
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SparklesIcon}
              message="The model didn't render any UI for this turn."
              testId="gen-ui-no-spec"
            />
          )}
        </div>
      ) : (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground"
          data-testid="gen-ui-empty-state"
        >
          <PanelRightIcon className="size-8 opacity-40" />
          <p className="text-center text-sm">
            Ask anything in the chat — UI will appear here when generated.
          </p>
        </div>
      )}
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
