"use client";

import { EyeIcon, LinkIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from "@/components/kibo-ui/gantt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface IGanttStatus {
  id: string;
  name: string;
  color: string;
}

export interface IGanttOwner {
  id?: string;
  name: string;
  image?: string;
}

export interface IGanttFeature {
  id: string;
  name: string;
  /** ISO-8601 timestamp or Date — converted to Date by the component. */
  startAt: string | Date;
  /** ISO-8601 timestamp or Date — converted to Date by the component. */
  endAt: string | Date;
  status: IGanttStatus;
  /** Optional grouping label for the left sidebar. Items with the same group share a section. */
  group?: string;
  owner?: IGanttOwner;
  url?: string;
}

export interface IGanttMarker {
  id: string;
  /** ISO-8601 timestamp or Date. */
  date: string | Date;
  label: string;
  className?: string;
}

export interface GanttChartComponentProps {
  features: IGanttFeature[];
  markers?: IGanttMarker[];
  range?: "daily" | "monthly" | "quarterly";
  zoom?: number;
}

type NormalizedGanttFeature = Omit<IGanttFeature, "startAt" | "endAt"> & {
  startAt: Date;
  endAt: Date;
};

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

const UNGROUPED_LABEL = "Items";

function groupFeatures(
  features: NormalizedGanttFeature[]
): Record<string, NormalizedGanttFeature[]> {
  const buckets: Record<string, NormalizedGanttFeature[]> = {};
  for (const feature of features) {
    const key = feature.group ?? UNGROUPED_LABEL;
    if (!buckets[key]) {
      buckets[key] = [];
    }
    buckets[key].push(feature);
  }
  return Object.fromEntries(
    Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b))
  );
}

export function GanttChartComponent({
  features: propsFeatures,
  markers: propsMarkers = [],
  range = "monthly",
  zoom = 100,
}: GanttChartComponentProps) {
  const [features, setFeatures] = useState<IGanttFeature[]>(propsFeatures);

  // Sync state when caller-supplied features identity changes (e.g., new search).
  useEffect(() => {
    setFeatures(propsFeatures);
  }, [propsFeatures]);

  const normalisedFeatures = useMemo(
    () =>
      features.map((feature) => ({
        ...feature,
        startAt: toDate(feature.startAt),
        endAt: toDate(feature.endAt),
      })),
    [features]
  );

  const grouped = useMemo(
    () => groupFeatures(normalisedFeatures),
    [normalisedFeatures]
  );

  const normalisedMarkers = useMemo(
    () =>
      propsMarkers.map((marker) => ({
        ...marker,
        date: toDate(marker.date),
      })),
    [propsMarkers]
  );

  const handleViewFeature = (id: string) => {
    const feature = features.find((f) => f.id === id);
    if (feature?.url) {
      window.open(feature.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyLink = (id: string) => {
    const feature = features.find((f) => f.id === id);
    if (feature?.url) {
      navigator.clipboard.writeText(feature.url);
    }
  };

  const handleMoveFeature = (
    id: string,
    startAt: Date,
    endAt: Date | null
  ) => {
    if (!endAt) {
      return;
    }
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === id
          ? { ...feature, startAt, endAt }
          : feature
      )
    );
  };

  return (
    <GanttProvider className="border" range={range} zoom={zoom}>
      <GanttSidebar>
        {Object.entries(grouped).map(([groupName, groupFeats]) => (
          <GanttSidebarGroup key={groupName} name={groupName}>
            {groupFeats.map((feature) => (
              <GanttSidebarItem
                feature={feature}
                key={feature.id}
                onSelectItem={handleViewFeature}
              />
            ))}
          </GanttSidebarGroup>
        ))}
      </GanttSidebar>
      <GanttTimeline>
        <GanttHeader />
        <GanttFeatureList>
          {Object.entries(grouped).map(([groupName, groupFeats]) => (
            <GanttFeatureListGroup key={groupName}>
              {groupFeats.map((feature) => (
                <div className="flex" key={feature.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => handleViewFeature(feature.id)}
                        type="button"
                      >
                        <GanttFeatureItem
                          onMove={handleMoveFeature}
                          {...feature}
                        >
                          <p className="flex-1 truncate text-xs">
                            {feature.name}
                          </p>
                          {feature.owner && (
                            <Avatar className="h-4 w-4">
                              {feature.owner.image && (
                                <AvatarImage src={feature.owner.image} />
                              )}
                              <AvatarFallback>
                                {feature.owner.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </GanttFeatureItem>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        disabled={!feature.url}
                        onClick={() => handleViewFeature(feature.id)}
                      >
                        <EyeIcon className="text-muted-foreground" size={16} />
                        View
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        disabled={!feature.url}
                        onClick={() => handleCopyLink(feature.id)}
                      >
                        <LinkIcon className="text-muted-foreground" size={16} />
                        Copy link
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              ))}
            </GanttFeatureListGroup>
          ))}
        </GanttFeatureList>
        {normalisedMarkers.map((marker) => (
          <GanttMarker {...marker} key={marker.id} />
        ))}
        <GanttToday />
      </GanttTimeline>
    </GanttProvider>
  );
}
