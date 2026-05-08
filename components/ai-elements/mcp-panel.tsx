"use client";

import { ServerIcon } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_MCP_CONFIG,
  MCP_CONFIG_COOKIE,
  MCP_CONFIG_STORAGE_KEY,
  type McpConfig,
  parseMcpConfig,
} from "@/lib/ai/mcp/config";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { JsonEditor } from "./json-editor";
import {
  type ConnectionStatus,
  MCPServerCard,
} from "./mcp-server-card";

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
    DEFAULT_MCP_CONFIG
  );
  // Fall back to DEFAULT_MCP_CONFIG when localStorage holds an empty config
  // (e.g. left over from a previous session or test run).
  const effective = useMemo(
    () =>
      Object.keys(stored.mcpServers).length === 0 ? DEFAULT_MCP_CONFIG : stored,
    [stored]
  );
  const storedText = useMemo(() => JSON.stringify(effective, null, 2), [effective]);
  const [draft, setDraft] = useState<string>(storedText);
  const [tab, setTab] = useState<"servers" | "json">("servers");
  const [connection, setConnection] = useState<Record<string, ConnectionStatus>>(
    {}
  );

  useEffect(() => {
    setMounted(true);
    // Write the cookie and probe all servers in the background on mount so:
    // 1. The server has config before the first chat message is sent.
    // 2. The status indicator is accurate without needing to open the panel.
    const config = Object.keys(stored.mcpServers).length === 0 ? DEFAULT_MCP_CONFIG : stored;
    setMcpCookie(JSON.stringify(config));
    for (const [name, server] of Object.entries(config.mcpServers)) {
      probeServer(name, server);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the cookie in sync whenever effective config changes, and re-probe
  // any servers that are new or just reconnected.
  useEffect(() => {
    if (mounted) {
      setMcpCookie(JSON.stringify(effective));
      for (const [name, server] of Object.entries(effective.mcpServers)) {
        probeServer(name, server);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective]);

  // Re-seed draft and reset tab when the panel opens.
  useEffect(() => {
    if (open) {
      setDraft(storedText);
      setTab("servers");
    }
  }, [open, storedText]);

  // Default every configured server to "connected" so the UI starts in a
  // sensible state. Servers removed from config drop their state too.
  useEffect(() => {
    setConnection((prev) => {
      const next: Record<string, ConnectionStatus> = {};
      for (const name of Object.keys(effective.mcpServers)) {
        next[name] = prev[name] ?? "connected";
      }
      return next;
    });
  }, [effective]);

  const validation = useMemo(() => parseMcpConfig(draft), [draft]);
  const serverEntries = useMemo(
    () => Object.entries(effective.mcpServers),
    [effective]
  );
  const serverCount = mounted ? serverEntries.length : 0;

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

  const setStatus = useCallback((name: string, status: ConnectionStatus) => {
    setConnection((prev) => ({ ...prev, [name]: status }));
  }, []);

  const probeServer = useCallback(
    async (name: string, server: import("@/lib/ai/mcp/config").McpServerConfig) => {
      setStatus(name, "connecting");
      try {
        const res = await fetch("/api/mcp/probe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: server.url,
            type: server.type,
            headers: server.headers,
          }),
        });
        const json = await res.json();
        setStatus(name, json.ok ? "connected" : "error");
      } catch {
        setStatus(name, "error");
      }
    },
    [setStatus]
  );

  const handleConnect = useCallback(
    (name: string) => {
      const server = effective.mcpServers[name];
      if (server) probeServer(name, server);
    },
    [effective, probeServer]
  );

  const handleDisconnect = useCallback(
    (name: string) => setStatus(name, "disconnected"),
    [setStatus]
  );

  const handleReconnect = useCallback(
    (name: string) => {
      const server = effective.mcpServers[name];
      if (server) probeServer(name, server);
    },
    [effective, probeServer]
  );

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
        className="w-[440px] rounded-xl border border-border/60 bg-card/95 p-3 backdrop-blur-xl shadow-(--shadow-float)"
        side="top"
        sideOffset={8}
      >
        <Tabs
          onValueChange={(v) => setTab(v as "servers" | "json")}
          value={tab}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-[13px]">MCP Servers</span>
            <TabsList>
              <TabsTrigger data-testid="mcp-tab-servers" value="servers">
                Servers
              </TabsTrigger>
              <TabsTrigger data-testid="mcp-tab-json" value="json">
                JSON
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="servers">
            <div
              className="flex h-72 flex-col gap-2 overflow-y-auto"
              data-testid="mcp-servers-list"
            >
              {serverEntries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-[12px] text-muted-foreground">
                  No servers configured. Add one in the JSON tab.
                </div>
              ) : (
                serverEntries.map(([name, server]) => (
                  <MCPServerCard
                    key={name}
                    name={name}
                    onConnect={() => handleConnect(name)}
                    onDisconnect={() => handleDisconnect(name)}
                    onReconnect={() => handleReconnect(name)}
                    server={server}
                    status={connection[name] ?? "connected"}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent className="flex h-72 flex-col gap-2" value="json">
            <JsonEditor
              className="min-h-0 flex-1 overflow-y-auto"
              data-testid="mcp-config-editor"
              onChange={handleChange}
              value={draft}
            />
            <div
              className={cn(
                "min-h-[18px] text-[11px]",
                validation.ok
                  ? "text-muted-foreground/60"
                  : "text-destructive"
              )}
              data-testid={
                validation.ok ? "mcp-config-status" : "mcp-config-error"
              }
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
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export const MCPPanelCompact = memo(PureMCPPanelCompact);
