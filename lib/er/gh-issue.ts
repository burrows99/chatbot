import { CanvasEntity } from "./canvas-entity";

export class GhUser extends CanvasEntity {
  login = "";
  id = 0;
  node_id = "";
  avatar_url = "";
  html_url = "";
  gravatar_id = "";
  type = "";
  site_admin = false;
  url = "";
  events_url = "";
  following_url = "";
  followers_url = "";
  gists_url = "";
  organizations_url = "";
  received_events_url = "";
  repos_url = "";
  starred_url = "";
  subscriptions_url = "";
}

export class GhReactions extends CanvasEntity {
  total_count = 0;
  "+1" = 0;
  "-1" = 0;
  laugh = 0;
  confused = 0;
  heart = 0;
  hooray = 0;
  rocket = 0;
  eyes = 0;
  url = "";
}

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
}

export class GhIssueSearchResult extends CanvasEntity {
  total_count = 0;
  incomplete_results = false;
  items: GhIssue[] = [];
}
