"use client";

import {
  ActionProvider,
  Renderer,
  StateProvider,
  useJsonRenderMessage,
  ValidationProvider,
  VisibilityProvider,
} from "@json-render/react";
import { PanelRightIcon, XIcon } from "lucide-react";
import { registry } from "@/lib/gen-ui/registry";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

function GenUIRenderer({ message }: { message: ChatMessage }) {
  const { spec } = useJsonRenderMessage(message.parts as never);

  if (!spec) {
    return null;
  }

  return (
    <StateProvider initialState={spec.state ?? {}}>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <ValidationProvider customFunctions={{}}>
            <Renderer registry={registry} spec={spec} />
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

export function GenUICanvas({
  onClose,
  messages,
}: {
  onClose: () => void;
  messages: ChatMessage[];
}) {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

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
        className="flex-1 overflow-y-auto p-4"
        data-testid="gen-ui-canvas-content"
      >
        {lastAssistantMessage ? (
          <GenUIRenderer message={lastAssistantMessage} />
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground"
            data-testid="gen-ui-empty-state"
          >
            <PanelRightIcon className="size-8 opacity-40" />
            <p className="text-center text-sm">
              Ask anything in the chat — UI will appear here when generated.
            </p>
          </div>
        )}
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
