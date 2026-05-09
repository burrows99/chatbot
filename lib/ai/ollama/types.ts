export type { OllamaProvider } from "ollama-ai-provider-v2";

export type OllamaScope = "local" | "cloud";

export type OllamaTag = {
  name: string;
  model?: string;
  details?: {
    family?: string;
    parameter_size?: string;
  };
};
