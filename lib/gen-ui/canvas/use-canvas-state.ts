"use client";

import { useSyncExternalStore } from "react";
import { canvas } from "./index";
import type { CanvasState } from "./types";

export function useCanvasState(): CanvasState {
  return useSyncExternalStore(
    canvas.store.subscribe,
    canvas.store.getSnapshot,
    canvas.store.getSnapshot
  );
}
