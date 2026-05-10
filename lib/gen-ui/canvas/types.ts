export type CanvasTransformer = (result: unknown) => Record<string, unknown>;

export type CanvasRenderResult =
  | { component: string; props: Record<string, unknown> }
  | { error: string };

export type CanvasOutput = {
  components: CanvasRenderResult[];
};

export type CanvasState = {
  components: CanvasRenderResult[];
  toolCallId: string | null;
};
