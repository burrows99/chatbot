import type { CanvasRenderResult, CanvasState } from "./types";

const EMPTY: CanvasState = { components: [], toolCallId: null };

// Reactive store backing the gen UI panel. Implements the contract expected by
// React's `useSyncExternalStore` (subscribe + getSnapshot). One instance lives
// on the Canvas; consumers read it via the `useCanvasState` hook.
export class CanvasStore {
  private state: CanvasState = EMPTY;
  private readonly listeners = new Set<() => void>();

  // Bound so it can be passed directly to useSyncExternalStore without losing `this`.
  readonly getSnapshot = (): CanvasState => this.state;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setFromPart(toolCallId: string, components: CanvasRenderResult[]): void {
    if (this.state.toolCallId === toolCallId) {
      return;
    }
    this.state = { components, toolCallId };
    this.emit();
  }

  clear(): void {
    if (this.state === EMPTY) {
      return;
    }
    this.state = EMPTY;
    this.emit();
  }

  private emit(): void {
    for (const l of this.listeners) {
      l();
    }
  }
}
