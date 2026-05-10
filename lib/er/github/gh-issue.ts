import type { IData } from "@/components/chat/data-grid";
import { CanvasEntity } from "../canvas-entity";
import { GhReactions } from "./gh-reactions";
import { GhUser } from "./gh-user";

export class GhIssue extends CanvasEntity {
  id = 0;
  number = 0;
  state = "";
  locked = false;
  title = "";
  body = "";
  author_association = "";
  user: GhUser = new GhUser();
  assignee: GhUser = new GhUser();
  assignees: GhUser[] = [];
  comments = 0;
  created_at = "";
  updated_at = "";
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
}
