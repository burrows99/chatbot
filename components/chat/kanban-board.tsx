"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import {
  KanbanBoard,
  KanbanBoardAccessibility,
  type KanbanBoardCircleColor,
  KanbanBoardCard,
  KanbanBoardCardButton,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardDescription,
  KanbanBoardCardTitle,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  KanbanBoardColumnTitle,
  KanbanBoardProvider,
  KanbanColorCircle,
} from "@/components/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface IKanbanCard {
  id: string;
  title: string;
  description?: string;
  avatar?: string;
  url?: string;
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
                    <div className="flex items-start gap-2">
                      {card.avatar !== undefined && (
                        <Avatar className="size-6 shrink-0">
                          <AvatarImage alt={card.title} src={card.avatar} />
                          <AvatarFallback>
                            {card.title
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="min-w-0 flex-1">
                        <KanbanBoardCardTitle className="truncate">
                          {card.url ? (
                            <Link
                              className="hover:text-primary"
                              href={card.url}
                              onClick={(event) => event.stopPropagation()}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {card.title}
                            </Link>
                          ) : (
                            card.title
                          )}
                        </KanbanBoardCardTitle>
                        {card.description && (
                          <KanbanBoardCardDescription className="mt-1 truncate">
                            {card.description}
                          </KanbanBoardCardDescription>
                        )}
                      </div>
                    </div>
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
