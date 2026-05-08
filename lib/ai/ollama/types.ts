import type { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export type OllamaScope = "local" | "cloud";

export type OllamaTag = {
  name: string;
  model?: string;
  details?: {
    family?: string;
    parameter_size?: string;
  };
};

export type OpenAICompatibleProvider = ReturnType<
  typeof createOpenAICompatible
>;
