export const OLLAMA_LOCAL_PROVIDER = "ollama";
export const OLLAMA_CLOUD_PROVIDER = "ollama-cloud";

export const DEFAULT_LOCAL_BASE_URL = "http://localhost:11434";
export const DEFAULT_CLOUD_BASE_URL = "https://ollama.com";
export const DEFAULT_TAG_REVALIDATE_SECONDS = 300;
export const DEFAULT_TITLE_MODEL_NAME = "gpt-oss:20b";

export const LOCAL_API_KEY_PLACEHOLDER = "ollama";
export const OPENAI_COMPAT_PATH = "/v1";
export const TAGS_PATH = "/api/tags";

export function isOllamaProviderId(provider: string): boolean {
  return (
    provider === OLLAMA_LOCAL_PROVIDER || provider === OLLAMA_CLOUD_PROVIDER
  );
}

export function isOllamaModelId(modelId: string): boolean {
  return (
    modelId.startsWith(`${OLLAMA_LOCAL_PROVIDER}:`) ||
    modelId.startsWith(`${OLLAMA_CLOUD_PROVIDER}:`)
  );
}
