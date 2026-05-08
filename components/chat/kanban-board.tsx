"use client";

import { GripVerticalIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Kanban,
  KanbanBoard as KanbanBoardPrimitive,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/reui/kanban";
import { Badge } from "@/components/ui/badge";

interface BoardItem {
  id: string | number;
  title: string;
  description?: string;
  column: string;
  labels?: string[];
  url?: string;
}

interface BoardColumn {
  id: string;
  title: string;
  color?: string;
}

interface KanbanBoardProps {
  columns?: BoardColumn[];
  items?: BoardItem[];
  title?: string;
}

const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export function KanbanBoard({ columns, items = [], title }: KanbanBoardProps) {
  const cols = columns && columns.length > 0 ? columns : DEFAULT_COLUMNS;

  const initialData = useMemo(() => {
    const result: Record<string, BoardItem[]> = {};
    for (const col of cols) {
      result[col.id] = items.filter((item) => item.column === col.id);
    }
    return result;
  }, [cols, items]);

  const [columnData, setColumnData] = useState(initialData);

  const colMap = useMemo(
    () => Object.fromEntries(cols.map((c) => [c.id, c])),
    [cols]
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      {title && (
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      )}
      <Kanban
        getItemValue={(item: BoardItem) => item.id.toString()}
        onValueChange={setColumnData}
        value={columnData}
      >
        <KanbanBoardPrimitive className="flex gap-3 overflow-x-auto flex-1 pb-2 grid-cols-none">
          {cols.map((col) => {
            const colItems = columnData[col.id] ?? [];
            return (
              <KanbanColumn
                className="flex flex-col min-w-[220px] flex-1"
                key={col.id}
                value={col.id}
              >
                <div className="flex items-center justify-between gap-2 px-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {col.title}
                    </span>
                    <Badge className="text-xs h-5 px-1.5" variant="secondary">
                      {colItems.length}
                    </Badge>
                  </div>
                  <KanbanColumnHandle className="text-muted-foreground hover:text-foreground">
                    <GripVerticalIcon size={14} />
                  </KanbanColumnHandle>
                </div>
                <KanbanColumnContent
                  className="rounded-lg bg-muted/40 p-2 flex-1 min-h-[120px]"
                  value={col.id}
                >
                  {colItems.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground py-6">
                      No items
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <KanbanItem
                        key={item.id.toString()}
                        value={item.id.toString()}
                      >
                        <KanbanItemHandle className="rounded-md bg-card border border-border/50 p-3 shadow-sm flex flex-col gap-1.5 hover:border-border transition-colors">
                          {item.url ? (
                            <a
                              className="text-sm font-medium text-foreground hover:underline leading-snug"
                              href={item.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {item.title}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-foreground leading-snug">
                              {item.title}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.labels && item.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {item.labels.map((label) => (
                                <Badge
                                  className="text-[10px] h-4 px-1.5 font-normal"
                                  key={label}
                                  variant="outline"
                                >
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </KanbanItemHandle>
                      </KanbanItem>
                    ))
                  )}
                </KanbanColumnContent>
              </KanbanColumn>
            );
          })}
        </KanbanBoardPrimitive>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === "column") {
              const col = colMap[value as string];
              return (
                <div className="flex flex-col min-w-[220px] rounded-lg bg-muted/60 p-2 border border-border opacity-90">
                  <span className="text-sm font-semibold text-foreground px-1">
                    {col?.title ?? value}
                  </span>
                </div>
              );
            }
            const item = Object.values(columnData)
              .flat()
              .find((i: BoardItem) => i.id.toString() === value);
            return (
              <div className="rounded-md bg-card border border-border p-3 shadow-lg flex flex-col gap-1.5 min-w-[220px]">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {item?.title ?? value}
                </p>
              </div>
            );
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
