import type {
  DataGridComponentProps,
  IData,
} from "@/components/chat/data-grid";
import type {
  IKanbanColumn,
  KanbanBoardComponentProps,
} from "@/components/chat/kanban-board";
import { CanvasEntity } from "../canvas-entity";
import { GhIssue } from "./gh-issue";

export class GitHubSearchIssuesToolResult extends CanvasEntity {
  total_count = 0;
  incomplete_results = false;
  private _items: GhIssue[] = [];

  get items(): GhIssue[] {
    return this._items;
  }
  set items(values: unknown[]) {
    this._items = (values ?? []).map((v) =>
      v instanceof GhIssue ? v : Object.assign(new GhIssue(), v)
    );
  }

  get iDataList(): IData[] {
    return this.items.map((item) => item.iData);
  }

  get dataGridProps(): DataGridComponentProps {
    return { data: this.iDataList };
  }

  get kanbanBoardProps(): KanbanBoardComponentProps {
    const open: IKanbanColumn = {
      id: "open",
      title: "Open",
      color: "green",
      cards: [],
    };
    const closed: IKanbanColumn = {
      id: "closed",
      title: "Closed",
      color: "violet",
      cards: [],
    };
    for (const issue of this.items) {
      const target = issue.state === "open" ? open : closed;
      target.cards.push(issue.kanbanCard);
    }
    return { columns: [open, closed] };
  }
}
