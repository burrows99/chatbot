import type { IData } from "@/components/chat/data-grid";
import type { IGanttFeature } from "@/components/chat/gantt-chart";
import type { IKanbanCard } from "@/components/chat/kanban-board";
import { CanvasEntity } from "../canvas-entity";
import type { GhLabel } from "./gh-label";
import { GhReactions } from "./gh-reactions";
import { GhUser } from "./gh-user";

export class GhIssue extends CanvasEntity {
  id = 0;
  number = 0;
  state = "";
  state_reason = "";
  locked = false;
  title = "";
  body = "";
  author_association = "";
  user: GhUser = new GhUser();
  assignee: GhUser = new GhUser();
  assignees: GhUser[] = [];
  labels: GhLabel[] = [];
  comments = 0;
  created_at = "";
  updated_at = "";
  closed_at = "";
  url = "";
  html_url = "";
  comments_url = "";
  events_url = "";
  labels_url = "";
  repository_url = "";
  reactions: GhReactions = new GhReactions();
  node_id = "";

  get iData(): IData {
    const open = this.state === "open";
    return {
      id: String(this.id),
      name: this.title || this.user?.login || "",
      availability: open ? "online" : "offline",
      avatar: this.user?.avatar_url ?? "",
      status: open ? "active" : "inactive",
      flag: "",
      email: "",
      company: this.user?.type ?? "",
      role: this.author_association,
      joined: this.created_at,
      location: this.user?.login ?? "",
      balance: this.comments,
      url: this.html_url,
    };
  }

  get kanbanCard(): IKanbanCard {
    const repoSlug = this.repository_url
      ? this.repository_url.replace(/^.*\/repos\//, "")
      : undefined;
    const reactionsCount = this.reactions?.total_count ?? 0;
    return {
      id: String(this.id),
      title: this.title || this.user?.login || "",
      avatar: this.user?.avatar_url,
      url: this.html_url,
      number: this.number,
      repoSlug,
      authorLogin: this.user?.login,
      authorAssociation: this.author_association,
      createdAt: this.created_at,
      closedAt: this.closed_at,
      commentsCount: this.comments,
      reactionsCount,
      labels: (this.labels ?? []).map((label) => ({
        name: label.name,
        color: label.color,
      })),
      assignees: (this.assignees ?? []).map((assignee) => ({
        login: assignee.login,
        avatar: assignee.avatar_url,
      })),
      stateReason: this.state_reason || undefined,
    };
  }

  get ganttFeature(): IGanttFeature {
    const open = this.state === "open";
    const status = open
      ? { id: "open", name: "Open", color: "#10B981" }
      : { id: "closed", name: "Closed", color: "#8B5CF6" };
    const repoSlug = this.repository_url
      ? this.repository_url.replace(/^.*\/repos\//, "")
      : undefined;
    return {
      id: String(this.id),
      name: this.title || this.user?.login || "",
      startAt: this.created_at,
      endAt: this.closed_at || new Date().toISOString(),
      status,
      group: repoSlug,
      owner: this.user?.login
        ? { id: this.user.login, name: this.user.login, image: this.user.avatar_url }
        : undefined,
      url: this.html_url,
    };
  }
}
