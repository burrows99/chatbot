"use client";

import { ServerIcon } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  EMPTY_MCP_CONFIG,
  MCP_CONFIG_COOKIE,
  MCP_CONFIG_STORAGE_KEY,
  type McpConfig,
  parseMcpConfig,
} from "@/lib/ai/mcp/config";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { JsonEditor } from "./json-editor";

function setMcpCookie(value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie sync
  document.cookie = `${MCP_CONFIG_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function PureMCPPanelCompact() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stored, setStored] = useLocalStorage<McpConfig>(
    MCP_CONFIG_STORAGE_KEY,
    EMPTY_MCP_CONFIG
  );
  const storedText = useMemo(() => JSON.stringify(stored, null, 2), [stored]);
  const [draft, setDraft] = useState<string>(storedText);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-seed draft from storage each time the panel opens, so reopening shows
  // the current saved value rather than a stale local edit.
  useEffect(() => {
    if (open) {
      setDraft(storedText);
    }
  }, [open, storedText]);

  const validation = useMemo(() => parseMcpConfig(draft), [draft]);
  const serverCount = mounted ? Object.keys(stored.mcpServers ?? {}).length : 0;

  const handleChange = useCallback((next: string) => {
    setDraft(next);
  }, []);

  const handleSave = () => {
    if (!validation.ok) {
      return;
    }
    setStored(validation.config);
    setMcpCookie(JSON.stringify(validation.config));
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="h-7 gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          data-testid="mcp-panel-trigger"
          variant="ghost"
        >
          <ServerIcon className="size-3.5" />
          <span>MCP{serverCount > 0 ? ` (${serverCount})` : ""}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        avoidCollisions={false}
        className="w-[420px] rounded-xl border border-border/60 bg-card/95 p-3 backdrop-blur-xl shadow-(--shadow-float)"
        side="top"
        sideOffset={8}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[13px]">MCP Servers</span>
            <span className="text-[11px] text-muted-foreground">
              JSON config
            </span>
          </div>
          <JsonEditor
            className="h-64"
            data-testid="mcp-config-editor"
            onChange={handleChange}
            value={draft}
          />
          <div
            className={cn(
              "min-h-[18px] text-[11px]",
              validation.ok ? "text-muted-foreground/60" : "text-destructive"
            )}
            data-testid={validation.ok ? "mcp-config-status" : "mcp-config-error"}
          >
            {validation.ok
              ? `${Object.keys(validation.config.mcpServers).length} server(s) configured`
              : validation.error}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              className="h-7 px-3 text-[12px]"
              data-testid="mcp-config-save"
              disabled={!validation.ok}
              onClick={handleSave}
              variant="default"
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const MCPPanelCompact = memo(PureMCPPanelCompact);
