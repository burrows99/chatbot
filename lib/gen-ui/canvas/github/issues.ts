import { DataGridComponent } from "@/components/chat/data-grid-component";
import { KanbanBoard } from "@/components/chat/kanban-board";
import type { Canvas } from "../canvas";
import { extractMcpJson } from "../mcp-utils";
import type { CanvasTransformer } from "../types";

type GhLabel = string | { name?: string };
type GhUser = { login?: string };
type GhIssue = {
  id?: number;
  number?: number;
  title?: string;
  state?: "open" | "closed";
  state_reason?: "completed" | "not_planned" | "reopened" | null;
  body?: string | null;
  html_url?: string;
  labels?: GhLabel[];
  assignee?: GhUser | null;
  assignees?: GhUser[] | null;
  pull_request?: unknown; // present if the item is actually a PR
};

// ─── extractors (shared by all renderers for these tools) ───────────────────

// Handles every shape we've seen GitHub MCP servers return:
//   - bare array of issues (public REST)
//   - { total_count, items: [...] } (search REST)
//   - { result: { items: [...] } } (some MCP wrappers)
//   - [{ items: [...] }] (single-element array wrapping a search response)
function unwrapIssues(data: unknown): GhIssue[] {
  if (Array.isArray(data)) {
    if (
      data.length === 1 &&
      data[0] &&
      typeof data[0] === "object" &&
      !("title" in data[0]) &&
      Array.isArray((data[0] as { items?: unknown }).items)
    ) {
      return (data[0] as { items: GhIssue[] }).items;
    }
    return data as GhIssue[];
  }
  if (!data || typeof data !== "object") {
    return [];
  }
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) {
    return obj.items as GhIssue[];
  }
  if (
    obj.result &&
    typeof obj.result === "object" &&
    Array.isArray((obj.result as { items?: unknown }).items)
  ) {
    return (obj.result as { items: GhIssue[] }).items;
  }
  return [];
}

const extractListIssues = (raw: unknown): GhIssue[] =>
  unwrapIssues(extractMcpJson(raw));

const extractSearchIssues = (raw: unknown): GhIssue[] =>
  unwrapIssues(extractMcpJson(raw));

// ─── shared helpers ─────────────────────────────────────────────────────────

function normalizeLabels(labels: GhLabel[] | undefined): string[] | null {
  if (!Array.isArray(labels) || labels.length === 0) {
    return null;
  }
  const names = labels
    .map((l) => (typeof l === "string" ? l : (l.name ?? "")))
    .filter((n): n is string => n.length > 0);
  return names.length > 0 ? names : null;
}

function pickAssignee(issue: GhIssue): string {
  return issue.assignee?.login ?? issue.assignees?.[0]?.login ?? "";
}

// ─── kanban ─────────────────────────────────────────────────────────────────

const ISSUE_KANBAN_COLUMNS = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

// Open + assigned → in_progress; open + unassigned → todo; closed → done.
function classifyIssue(issue: GhIssue): "todo" | "in_progress" | "done" {
  if (issue.state === "closed") {
    return "done";
  }
  const hasAssignee =
    Boolean(issue.assignee?.login) ||
    (Array.isArray(issue.assignees) && issue.assignees.length > 0);
  return hasAssignee ? "in_progress" : "todo";
}

function issuesToKanbanProps(
  issues: GhIssue[],
  title: string
): Record<string, unknown> {
  return {
    title,
    columns: ISSUE_KANBAN_COLUMNS,
    items: issues.map((issue, idx) => ({
      id: issue.number ?? issue.id ?? `issue-${idx}`,
      title: issue.title ?? "(untitled)",
      description: issue.body ?? null,
      column: classifyIssue(issue),
      labels: normalizeLabels(issue.labels),
      url: issue.html_url ?? null,
    })),
  };
}

// ─── data grid ──────────────────────────────────────────────────────────────

const ISSUE_DATAGRID_COLUMNS = [
  {
    key: "number",
    header: "#",
    type: "number",
    align: "right",
    width: 70,
  },
  { key: "title", header: "Title", type: "link", hrefKey: "url" },
  { key: "state", header: "State", type: "badge" },
  { key: "assignee", header: "Assignee", type: "text" },
  { key: "labels", header: "Labels", type: "text" },
];

function issuesToDataGridProps(
  issues: GhIssue[],
  title: string
): Record<string, unknown> {
  return {
    title,
    columns: ISSUE_DATAGRID_COLUMNS,
    rows: issues.map((issue, idx) => ({
      id: issue.number ?? issue.id ?? `issue-${idx}`,
      number: issue.number ?? issue.id ?? 0,
      title: issue.title ?? "(untitled)",
      url: issue.html_url ?? "",
      state: issue.state ?? "",
      assignee: pickAssignee(issue),
      labels: normalizeLabels(issue.labels)?.join(", ") ?? "",
    })),
    pageSize: 10,
  };
}

// ─── transformers ───────────────────────────────────────────────────────────

const listIssuesToKanban: CanvasTransformer = (raw) =>
  issuesToKanbanProps(extractListIssues(raw), "Issues");

const searchIssuesToKanban: CanvasTransformer = (raw) =>
  issuesToKanbanProps(extractSearchIssues(raw), "Search results");

const listIssuesToDataGrid: CanvasTransformer = (raw) =>
  issuesToDataGridProps(extractListIssues(raw), "Issues");

const searchIssuesToDataGrid: CanvasTransformer = (raw) =>
  issuesToDataGridProps(extractSearchIssues(raw), "Search results");

// ─── registration ───────────────────────────────────────────────────────────

export function register(canvas: Canvas): void {
  canvas
    .registerComponent("KanbanBoard", KanbanBoard)
    .registerComponent("DataGrid", DataGridComponent)
    .bind("github__list_issues", {
      KanbanBoard: listIssuesToKanban,
      DataGrid: listIssuesToDataGrid,
    })
    .bind("github__search_issues", {
      KanbanBoard: searchIssuesToKanban,
      DataGrid: searchIssuesToDataGrid,
    });
}
