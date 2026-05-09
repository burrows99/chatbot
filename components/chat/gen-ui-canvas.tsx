"use client";

import {
  autoFixSpec,
  type Spec,
  type SpecIssue,
  validateSpec,
} from "@json-render/core";
import {
  type DataPart,
  JSONUIProvider,
  Renderer,
  useJsonRenderMessage,
} from "@json-render/react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangleIcon,
  CodeIcon,
  InfoIcon,
  PanelRightIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useMemo } from "react";
import { registry } from "@/lib/gen-ui/registry";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

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

function AutoFixNotes({ notes }: { notes: string[] }) {
  return (
    <div
      className="mb-3 rounded-md border border-blue-500/40 bg-blue-500/5 p-3 text-blue-700 dark:text-blue-400"
      data-testid="gen-ui-autofix-notes"
    >
      <div className="flex items-center gap-2 font-medium text-xs">
        <InfoIcon className="size-3.5" />
        Spec auto-corrections applied
      </div>
      <ul className="mt-1.5 list-disc pl-5 text-xs leading-relaxed">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

function SpecIssues({ issues }: { issues: SpecIssue[] }) {
  return (
    <div
      className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-400"
      data-testid="gen-ui-spec-issues"
    >
      <div className="flex items-center gap-2 font-medium text-xs">
        <AlertTriangleIcon className="size-3.5" />
        Spec validation issues
      </div>
      <ul className="mt-1.5 list-disc pl-5 text-xs leading-relaxed">
        {issues.map((issue) => (
          <li key={`${issue.code}:${issue.elementKey ?? ""}`}>
            <span className="font-medium">[{issue.severity}]</span>{" "}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GenUICanvas({
  onClose,
  messages,
  isLoading = false,
}: {
  onClose: () => void;
  messages: ChatMessage[];
  isLoading?: boolean;
}) {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const parts = (lastAssistantMessage?.parts ?? []) as DataPart[];
  const { spec: rawSpec, hasSpec } = useJsonRenderMessage(parts);

  const { spec, issues, autoFixNotes } = useMemo<{
    spec: Spec | null;
    issues: SpecIssue[];
    autoFixNotes: string[];
  }>(() => {
    if (!(hasSpec && rawSpec)) {
      return { spec: null, issues: [], autoFixNotes: [] };
    }
    const { spec: fixed, fixes } = autoFixSpec(rawSpec);
    if (isLoading) {
      return { spec: fixed, issues: [], autoFixNotes: fixes };
    }
    const result = validateSpec(fixed, { checkOrphans: true });
    return { spec: fixed, issues: result.issues, autoFixNotes: fixes };
  }, [rawSpec, hasSpec, isLoading]);

  const blockingErrors = issues.filter((i) => i.severity === "error");

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

      {lastAssistantMessage ? (
        <Tabs className="flex min-h-0 flex-1 flex-col" defaultValue="rendered">
          <div className="flex shrink-0 items-center border-b border-border/40 px-4 py-2">
            <TabsList>
              <TabsTrigger data-testid="gen-ui-tab-rendered" value="rendered">
                <SparklesIcon className="mr-1.5 size-3" />
                Rendered
              </TabsTrigger>
              <TabsTrigger data-testid="gen-ui-tab-json" value="json">
                <CodeIcon className="mr-1.5 size-3" />
                Raw JSON
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            className="min-h-0 flex-1 overflow-y-auto p-4"
            data-testid="gen-ui-canvas-content"
            value="rendered"
          >
            {spec ? (
              <>
                {autoFixNotes.length > 0 && (
                  <AutoFixNotes notes={autoFixNotes} />
                )}
                {issues.length > 0 && <SpecIssues issues={issues} />}
                {blockingErrors.length === 0 && (
                  <JSONUIProvider initialState={spec.state} registry={registry}>
                    <Renderer
                      loading={isLoading}
                      registry={registry}
                      spec={spec}
                    />
                  </JSONUIProvider>
                )}
              </>
            ) : (
              <EmptyState
                icon={SparklesIcon}
                message="The model didn't emit a UI spec for this turn."
                testId="gen-ui-no-spec"
              />
            )}
          </TabsContent>

          <TabsContent
            className="min-h-0 flex-1 overflow-y-auto p-4"
            value="json"
          >
            {spec ? (
              <pre
                className="overflow-auto rounded-md border border-border/40 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed"
                data-testid="gen-ui-json"
              >
                {JSON.stringify(spec, null, 2)}
              </pre>
            ) : (
              <EmptyState
                icon={CodeIcon}
                message="No spec emitted for this turn."
                testId="gen-ui-no-json"
              />
            )}
          </TabsContent>
        </Tabs>
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
