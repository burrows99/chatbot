"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ExternalLinkIcon,
  MessageSquareIcon,
  SmileIcon,
} from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useId, useState } from "react";
import {
  KanbanBoard,
  KanbanBoardAccessibility,
  KanbanBoardCard,
  KanbanBoardCardButton,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardTitle,
  type KanbanBoardCircleColor,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  KanbanBoardColumnTitle,
  KanbanBoardProvider,
  KanbanColorCircle,
} from "@/components/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface IKanbanCardLabel {
  name: string;
  color: string;
}

export interface IKanbanCardAssignee {
  login: string;
  avatar: string;
}

export interface IKanbanCard {
  id: string;
  title: string;
  description?: string;
  avatar?: string;
  url?: string;
  number?: number;
  repoSlug?: string;
  authorLogin?: string;
  authorAssociation?: string;
  createdAt?: string;
  closedAt?: string;
  commentsCount?: number;
  reactionsCount?: number;
  labels?: IKanbanCardLabel[];
  assignees?: IKanbanCardAssignee[];
  stateReason?: string;
}

export interface IKanbanColumn {
  id: string;
  title: string;
  color?: KanbanBoardCircleColor;
  cards: IKanbanCard[];
}

export interface KanbanBoardComponentProps {
  columns: IKanbanColumn[];
}

type DragPayload = { id: string };

function parseDragPayload(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DragPayload>;
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

function moveCardInColumns(
  prev: IKanbanColumn[],
  cardId: string,
  targetColumnId: string,
  anchorCardId?: string,
  position: "top" | "bottom" = "bottom"
): IKanbanColumn[] {
  let card: IKanbanCard | undefined;
  const stripped = prev.map((col) => {
    const idx = col.cards.findIndex((c) => c.id === cardId);
    if (idx < 0) {
      return col;
    }
    card = col.cards[idx];
    return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
  });
  if (!card) {
    return prev;
  }
  const movedCard = card;
  return stripped.map((col) => {
    if (col.id !== targetColumnId) {
      return col;
    }
    if (!anchorCardId) {
      return { ...col, cards: [...col.cards, movedCard] };
    }
    const anchorIdx = col.cards.findIndex((c) => c.id === anchorCardId);
    if (anchorIdx < 0) {
      return { ...col, cards: [...col.cards, movedCard] };
    }
    const insertAt = position === "top" ? anchorIdx : anchorIdx + 1;
    const next = [...col.cards];
    next.splice(insertAt, 0, movedCard);
    return { ...col, cards: next };
  });
}

function formatRelative(iso?: string): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return formatDistanceToNow(date, { addSuffix: true });
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function KanbanCardBody({ card }: { card: IKanbanCard }) {
  const created = formatRelative(card.createdAt);
  const closed = formatRelative(card.closedAt);
  const labels = card.labels ?? [];
  const assignees = card.assignees ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {card.avatar !== undefined && (
          <Avatar className="size-6 shrink-0">
            <AvatarImage alt={card.title} src={card.avatar} />
            <AvatarFallback>
              {initialsFor(card.title || card.authorLogin || "?")}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          <KanbanBoardCardTitle className="truncate">
            {card.url ? (
              <Link
                className="hover:text-primary"
                href={card.url}
                onClick={(event: MouseEvent) => event.stopPropagation()}
                rel="noopener noreferrer"
                target="_blank"
              >
                {card.title}
              </Link>
            ) : (
              card.title
            )}
          </KanbanBoardCardTitle>
          {(card.repoSlug || card.number !== undefined) && (
            <div className="mt-0.5 truncate text-muted-foreground text-xs">
              {card.repoSlug ?? ""}
              {card.repoSlug && card.number !== undefined ? " " : ""}
              {card.number !== undefined ? `#${card.number}` : ""}
            </div>
          )}
        </div>
      </div>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {labels.slice(0, 5).map((label) => (
            <span
              className="inline-flex items-center rounded-full border px-1.5 py-0.5 font-medium text-[10px] leading-none"
              key={label.name}
              style={{
                borderColor: `#${label.color}`,
                color: `#${label.color}`,
              }}
            >
              {label.name}
            </span>
          ))}
          {labels.length > 5 && (
            <span className="text-[10px] text-muted-foreground">
              +{labels.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-muted-foreground text-xs">
        <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
          {card.authorLogin && (
            <span className="truncate">@{card.authorLogin}</span>
          )}
          {created && (
            <>
              <span className="opacity-50">·</span>
              <span className="truncate">
                opened {created}
                {closed ? `, closed ${closed}` : ""}
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {card.commentsCount !== undefined && card.commentsCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquareIcon className="size-3" />
              {card.commentsCount}
            </span>
          )}
          {card.reactionsCount !== undefined && card.reactionsCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <SmileIcon className="size-3" />
              {card.reactionsCount}
            </span>
          )}
        </div>
      </div>

      {assignees.length > 0 && (
        <div className="-space-x-1.5 flex">
          {assignees.slice(0, 4).map((assignee) => (
            <Avatar
              className="size-5 ring-2 ring-background"
              key={assignee.login}
            >
              <AvatarImage alt={assignee.login} src={assignee.avatar} />
              <AvatarFallback>{initialsFor(assignee.login)}</AvatarFallback>
            </Avatar>
          ))}
          {assignees.length > 4 && (
            <span className="ml-2 text-[10px] text-muted-foreground">
              +{assignees.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function KanbanBoardComponent({
  columns: propsColumns,
}: KanbanBoardComponentProps) {
  const hiddenTextDescribedById = useId();
  const [columns, setColumns] = useState<IKanbanColumn[]>(propsColumns);

  useEffect(() => {
    setColumns(propsColumns);
  }, [propsColumns]);

  return (
    <KanbanBoardProvider>
      <KanbanBoardAccessibility
        hiddenTextDescribedById={hiddenTextDescribedById}
      />
      <KanbanBoard className="h-full">
        {columns.map((col) => (
          <KanbanBoardColumn
            columnId={col.id}
            key={col.id}
            onDropOverColumn={(raw) => {
              const cardId = parseDragPayload(raw);
              if (cardId) {
                setColumns((prev) => moveCardInColumns(prev, cardId, col.id));
              }
            }}
          >
            <KanbanBoardColumnHeader>
              <KanbanBoardColumnTitle columnId={col.id}>
                {col.color && <KanbanColorCircle color={col.color} />}
                {col.title}
              </KanbanBoardColumnTitle>
              <span className="text-muted-foreground text-xs">
                {col.cards.length}
              </span>
            </KanbanBoardColumnHeader>
            <KanbanBoardColumnList>
              {col.cards.map((card) => (
                <KanbanBoardColumnListItem
                  cardId={card.id}
                  key={card.id}
                  onDropOverListItem={(raw, direction) => {
                    const cardId = parseDragPayload(raw);
                    if (
                      cardId &&
                      cardId !== card.id &&
                      (direction === "top" || direction === "bottom")
                    ) {
                      setColumns((prev) =>
                        moveCardInColumns(
                          prev,
                          cardId,
                          col.id,
                          card.id,
                          direction
                        )
                      );
                    }
                  }}
                >
                  <KanbanBoardCard data={{ id: card.id }}>
                    {card.url && (
                      <KanbanBoardCardButtonGroup>
                        <KanbanBoardCardButton
                          onClick={(event) => {
                            event.stopPropagation();
                            window.open(
                              card.url,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                          tooltip="Open on GitHub"
                        >
                          <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                        </KanbanBoardCardButton>
                      </KanbanBoardCardButtonGroup>
                    )}
                    <KanbanCardBody card={card} />
                  </KanbanBoardCard>
                </KanbanBoardColumnListItem>
              ))}
            </KanbanBoardColumnList>
          </KanbanBoardColumn>
        ))}
      </KanbanBoard>
    </KanbanBoardProvider>
  );
}
