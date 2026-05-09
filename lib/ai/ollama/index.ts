import type { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import type { ChatModel, ModelCapabilities } from "../models";
import {
  DEFAULT_CLOUD_BASE_URL,
  DEFAULT_LOCAL_BASE_URL,
  DEFAULT_TAG_REVALIDATE_SECONDS,
  DEFAULT_TITLE_MODEL_NAME,
  isOllamaModelId,
  isOllamaProviderId,
  OLLAMA_CLOUD_PROVIDER,
  OLLAMA_LOCAL_PROVIDER,
  TAGS_PATH,
} from "./constants";
import type { OllamaScope, OllamaTag } from "./types";

export {
  isOllamaModelId,
  isOllamaProviderId,
  OLLAMA_CLOUD_PROVIDER,
  OLLAMA_LOCAL_PROVIDER,
} from "./constants";
export type { OllamaScope, OllamaTag } from "./types";

export class OllamaManager {
  private static _instance: OllamaManager | null = null;

  private readonly _localBaseURL: string;
  private readonly _cloudBaseURL: string;
  private readonly _cloudApiKey: string | undefined;
  private readonly _tagRevalidateSeconds: number;

  private constructor() {
    this._localBaseURL = (
      process.env.OLLAMA_BASE_URL ?? DEFAULT_LOCAL_BASE_URL
    ).replace(/\/$/, "");
    this._cloudBaseURL = DEFAULT_CLOUD_BASE_URL;
    this._cloudApiKey = process.env.OLLAMA_API_KEY || undefined;
    this._tagRevalidateSeconds = DEFAULT_TAG_REVALIDATE_SECONDS;
  }

  static getInstance(): OllamaManager {
    if (!OllamaManager._instance) {
      OllamaManager._instance = new OllamaManager();
    }
    return OllamaManager._instance as OllamaManager;
  }

  // --- public API ---

  isOllamaModelId(modelId: string): boolean {
    return isOllamaModelId(modelId);
  }

  isOllamaProviderId(providerId: string): boolean {
    return isOllamaProviderId(providerId);
  }

  isCloudConfigured(): boolean {
    return !!this._cloudApiKey;
  }

  getTitleLanguageModel(): LanguageModel | null {
    if (!this._cloudApiKey) {
      return null;
    }
    return this.makeProvider(this._cloudBaseURL, this._cloudApiKey).chat(
      DEFAULT_TITLE_MODEL_NAME
    );
  }

  getLanguageModel(modelId: string): LanguageModel {
    if (modelId.startsWith(`${OLLAMA_LOCAL_PROVIDER}:`)) {
      const name = this.stripPrefix(modelId, OLLAMA_LOCAL_PROVIDER);
      return this.makeProvider(this._localBaseURL).chat(name);
    }
    if (modelId.startsWith(`${OLLAMA_CLOUD_PROVIDER}:`)) {
      if (!this._cloudApiKey) {
        throw new Error(
          "OLLAMA_API_KEY is not configured — cloud Ollama models are unavailable."
        );
      }
      const name = this.stripPrefix(modelId, OLLAMA_CLOUD_PROVIDER);
      return this.makeProvider(this._cloudBaseURL, this._cloudApiKey).chat(
        name
      );
    }
    throw new Error(`Not an Ollama model id: ${modelId}`);
  }

  async listLocalModels(): Promise<ChatModel[]> {
    const tags = await this.fetchTags(this._localBaseURL);
    return tags.map((t) => this.tagToChatModel(t, "local"));
  }

  async listCloudModels(): Promise<ChatModel[]> {
    if (!this._cloudApiKey) {
      return [];
    }
    const tags = await this.fetchTags(this._cloudBaseURL, this._cloudApiKey);
    return tags.map((t) => this.tagToChatModel(t, "cloud"));
  }

  async listAllModels(): Promise<ChatModel[]> {
    const [local, cloud] = await Promise.all([
      this.listLocalModels(),
      this.listCloudModels(),
    ]);
    return [...local, ...cloud];
  }

  capabilitiesFor(_modelId: string): ModelCapabilities {
    return { tools: true, vision: false, reasoning: true };
  }

  capabilitiesForAll(modelIds: string[]): Record<string, ModelCapabilities> {
    return Object.fromEntries(
      modelIds
        .filter((id) => this.isOllamaModelId(id))
        .map((id) => [id, this.capabilitiesFor(id)])
    );
  }

  // --- internals ---

  private makeProvider(baseURL: string, apiKey?: string) {
    return createOllama({
      baseURL: `${baseURL}/api`,
      ...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {}),
    });
  }

  private stripPrefix(modelId: string, prefix: string): string {
    return modelId.slice(prefix.length + 1);
  }

  private async fetchTags(
    baseURL: string,
    apiKey?: string
  ): Promise<OllamaTag[]> {
    try {
      const res = await fetch(`${baseURL}${TAGS_PATH}`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        next: { revalidate: this._tagRevalidateSeconds },
      });
      if (!res.ok) {
        return [];
      }
      const json = (await res.json()) as { models?: OllamaTag[] };
      return json.models ?? [];
    } catch {
      return [];
    }
  }

  private tagToChatModel(tag: OllamaTag, scope: OllamaScope): ChatModel {
    const providerId =
      scope === "local" ? OLLAMA_LOCAL_PROVIDER : OLLAMA_CLOUD_PROVIDER;
    const size = tag.details?.parameter_size;
    const family = tag.details?.family;
    const fallback =
      scope === "local" ? "Local Ollama model" : "Ollama Cloud model";
    const description = [family, size].filter(Boolean).join(" · ") || fallback;

    return {
      id: `${providerId}:${tag.name}`,
      name: tag.name,
      provider: providerId,
      description,
    };
  }
}

export const ollamaManager = OllamaManager.getInstance();
