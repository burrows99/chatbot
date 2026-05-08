import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { ChatModel, ModelCapabilities } from "../models";
import {
  DEFAULT_CLOUD_BASE_URL,
  DEFAULT_LOCAL_BASE_URL,
  DEFAULT_TAG_REVALIDATE_SECONDS,
  DEFAULT_TITLE_MODEL_NAME,
  isOllamaModelId,
  isOllamaProviderId,
  LOCAL_API_KEY_PLACEHOLDER,
  OLLAMA_CLOUD_PROVIDER,
  OLLAMA_LOCAL_PROVIDER,
  OPENAI_COMPAT_PATH,
  TAGS_PATH,
} from "./constants";
import type { OllamaScope, OllamaTag, OpenAICompatibleProvider } from "./types";

export {
  isOllamaModelId,
  isOllamaProviderId,
  OLLAMA_CLOUD_PROVIDER,
  OLLAMA_LOCAL_PROVIDER,
} from "./constants";
export type { OllamaScope, OllamaTag } from "./types";

export class OllamaManager {
  private static _instance: OllamaManager | null = null;

  private _localBaseURL!: string;
  private _cloudBaseURL!: string;
  private _cloudApiKey: string | undefined;
  private _tagRevalidateSeconds!: number;

  private _localProvider!: OpenAICompatibleProvider;
  private _cloudProvider: OpenAICompatibleProvider | null = null;

  private constructor() {
    this.localBaseURL = process.env.OLLAMA_BASE_URL ?? DEFAULT_LOCAL_BASE_URL;
    this.cloudBaseURL = DEFAULT_CLOUD_BASE_URL;
    this.cloudApiKey = process.env.OLLAMA_API_KEY || undefined;
    this.tagRevalidateSeconds = DEFAULT_TAG_REVALIDATE_SECONDS;
  }

  static getInstance(): OllamaManager {
    if (!OllamaManager._instance) {
      OllamaManager._instance = new OllamaManager();
    }
    return OllamaManager._instance;
  }

  // --- config accessors ---

  get localBaseURL(): string {
    return this._localBaseURL;
  }

  set localBaseURL(value: string) {
    this._localBaseURL = value.replace(/\/$/, "");
    this._localProvider = createOpenAICompatible({
      name: OLLAMA_LOCAL_PROVIDER,
      baseURL: `${this._localBaseURL}${OPENAI_COMPAT_PATH}`,
      apiKey: LOCAL_API_KEY_PLACEHOLDER,
    });
  }

  get cloudBaseURL(): string {
    return this._cloudBaseURL;
  }

  set cloudBaseURL(value: string) {
    this._cloudBaseURL = value.replace(/\/$/, "");
    this.refreshCloudProvider();
  }

  get cloudApiKey(): string | undefined {
    return this._cloudApiKey;
  }

  set cloudApiKey(value: string | undefined) {
    this._cloudApiKey = value || undefined;
    this.refreshCloudProvider();
  }

  get tagRevalidateSeconds(): number {
    return this._tagRevalidateSeconds;
  }

  set tagRevalidateSeconds(value: number) {
    this._tagRevalidateSeconds = value;
  }

  get localProvider(): OpenAICompatibleProvider {
    return this._localProvider;
  }

  get cloudProvider(): OpenAICompatibleProvider | null {
    return this._cloudProvider;
  }

  // --- public API ---

  isOllamaModelId(modelId: string): boolean {
    return isOllamaModelId(modelId);
  }

  isOllamaProviderId(providerId: string): boolean {
    return isOllamaProviderId(providerId);
  }

  isCloudConfigured(): boolean {
    return this._cloudProvider !== null;
  }

  /**
   * Returns a small fast cloud Ollama model suitable for title generation,
   * or null if cloud isn't configured. Used so the app can stop depending
   * on the Vercel AI Gateway for title generation.
   */
  getTitleLanguageModel(): LanguageModel | null {
    if (!this._cloudProvider) {
      return null;
    }
    return this._cloudProvider(DEFAULT_TITLE_MODEL_NAME);
  }

  getLanguageModel(modelId: string): LanguageModel {
    if (modelId.startsWith(`${OLLAMA_LOCAL_PROVIDER}:`)) {
      return this._localProvider(
        this.stripPrefix(modelId, OLLAMA_LOCAL_PROVIDER)
      );
    }
    if (modelId.startsWith(`${OLLAMA_CLOUD_PROVIDER}:`)) {
      if (!this._cloudProvider) {
        throw new Error(
          "OLLAMA_API_KEY is not configured — cloud Ollama models are unavailable."
        );
      }
      return this._cloudProvider(
        this.stripPrefix(modelId, OLLAMA_CLOUD_PROVIDER)
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

  /**
   * Default capability hints. Cloud models reliably implement OpenAI-format
   * tool calling; small local models often don't and break the stream when
   * tool definitions are attached. Per-model overrides can refine this.
   */
  capabilitiesFor(_modelId: string): ModelCapabilities {
    // Both local and cloud Ollama models use an OpenAI-compatible API that
    // supports tool calling. Cloud models are more reliable, but local models
    // that the user explicitly selects are expected to work.
    return { tools: true, vision: false, reasoning: false };
  }

  capabilitiesForAll(modelIds: string[]): Record<string, ModelCapabilities> {
    return Object.fromEntries(
      modelIds
        .filter((id) => this.isOllamaModelId(id))
        .map((id) => [id, this.capabilitiesFor(id)])
    );
  }

  // --- internals ---

  private refreshCloudProvider(): void {
    this._cloudProvider = this._cloudApiKey
      ? createOpenAICompatible({
          name: OLLAMA_CLOUD_PROVIDER,
          baseURL: `${this._cloudBaseURL}${OPENAI_COMPAT_PATH}`,
          apiKey: this._cloudApiKey,
        })
      : null;
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
