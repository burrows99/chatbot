"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  PlugIcon,
  RotateCwIcon,
  UnplugIcon,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type McpServerConfig,
  transportOf,
} from "@/lib/ai/mcp/config";
import {
  findTokenHeaders,
  type TokenHeader,
} from "@/lib/ai/mcp/headers";
import { cn } from "@/lib/utils";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error"
  | "no-tools";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  connecting: "Connecting…",
  error: "Error",
  "no-tools": "No tools",
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-500",
  disconnected: "bg-muted-foreground/40",
  connecting: "bg-amber-500 animate-pulse",
  error: "bg-destructive",
  "no-tools": "bg-amber-500",
};

export type McpToolInfo = {
  name: string;
  description?: string;
};

type Props = {
  name: string;
  server: McpServerConfig;
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  tools?: McpToolInfo[];
};

function TokenRow({ header }: { header: TokenHeader }) {
  const [revealed, setRevealed] = useState(false);
  const Icon = revealed ? EyeOffIcon : EyeIcon;

  return (
    <div
      className="flex items-center gap-1.5 text-[11px]"
      data-testid="mcp-server-token-row"
    >
      <span
        className="text-muted-foreground shrink-0"
        data-testid="mcp-server-token-name"
      >
        {header.name}:
      </span>
      {header.scheme && (
        <span className="text-muted-foreground/80 font-mono shrink-0">
          {header.scheme}
        </span>
      )}
      <Input
        className="h-6 flex-1 rounded-md font-mono text-[11px] px-2 py-0"
        data-testid="mcp-server-token-value"
        readOnly
        type={revealed ? "text" : "password"}
        value={header.secret}
      />
      <Button
        aria-label={revealed ? "Hide token" : "Show token"}
        className="h-5 w-5 p-0 shrink-0"
        data-testid="mcp-server-token-toggle"
        onClick={() => setRevealed((v) => !v)}
        type="button"
        variant="ghost"
      >
        <Icon className="size-3" />
      </Button>
    </div>
  );
}

function PureMCPServerCard({
  name,
  server,
  status,
  onConnect,
  onDisconnect,
  onReconnect,
  tools,
}: Props) {
  const transport = transportOf(server);
  const busy = status === "connecting";
  const tokenHeaders = useMemo(
    () => findTokenHeaders(server.headers),
    [server.headers]
  );
  const toolCount = tools?.length ?? 0;
  const [toolsExpanded, setToolsExpanded] = useState(false);

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/60 p-3"
      data-testid={`mcp-server-card-${name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[13px] truncate">{name}</span>
            <Badge
              className="h-4 px-1.5 text-[10px] uppercase"
              data-testid="mcp-server-transport"
              variant="outline"
            >
              {transport}
            </Badge>
          </div>
          <span
            className="truncate text-[11px] text-muted-foreground"
            title={server.url}
          >
            {server.url}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0"
          data-testid="mcp-server-status"
        >
          <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
          {STATUS_LABEL[status]}
        </div>
      </div>
      {tokenHeaders.length > 0 && (
        <div className="flex flex-col gap-1">
          {tokenHeaders.map((h) => (
            <TokenRow header={h} key={h.name} />
          ))}
        </div>
      )}
      {toolCount > 0 && (
        <div
          className="flex flex-col gap-1"
          data-testid="mcp-server-tools"
        >
          <button
            aria-expanded={toolsExpanded}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            data-testid="mcp-server-tools-toggle"
            onClick={() => setToolsExpanded((v) => !v)}
            type="button"
          >
            {toolsExpanded ? (
              <ChevronDownIcon className="size-3" />
            ) : (
              <ChevronRightIcon className="size-3" />
            )}
            <span>
              {toolCount} tool{toolCount === 1 ? "" : "s"}
            </span>
          </button>
          {toolsExpanded && tools && (
            <ul
              className="max-h-40 overflow-y-auto rounded-md border border-border/40 bg-background/40 p-1.5"
              data-testid="mcp-server-tools-list"
            >
              {tools.map((tool) => (
                <li
                  className="flex flex-col px-1.5 py-1 hover:bg-muted/40 rounded"
                  key={tool.name}
                >
                  <code className="font-mono text-[11px] text-foreground">
                    {tool.name}
                  </code>
                  {tool.description && (
                    <span className="line-clamp-2 text-[10px] text-muted-foreground">
                      {tool.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex justify-end gap-1.5">
        {status === "disconnected" ? (
          <Button
            className="h-6 px-2 text-[11px]"
            data-testid="mcp-server-connect"
            disabled={busy}
            onClick={onConnect}
            variant="outline"
          >
            <PlugIcon className="size-3" /> Connect
          </Button>
        ) : (
          <>
            <Button
              className="h-6 px-2 text-[11px]"
              data-testid="mcp-server-reconnect"
              disabled={busy}
              onClick={onReconnect}
              variant="outline"
            >
              <RotateCwIcon className="size-3" /> Reconnect
            </Button>
            <Button
              className="h-6 px-2 text-[11px]"
              data-testid="mcp-server-disconnect"
              disabled={busy}
              onClick={onDisconnect}
              variant="ghost"
            >
              <UnplugIcon className="size-3" /> Disconnect
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export const MCPServerCard = memo(PureMCPServerCard);
