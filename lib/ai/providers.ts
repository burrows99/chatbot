import { customProvider, gateway } from "ai";
import { isTestEnvironment } from "../constants";
import { ollamaManager } from "./ollama";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  if (ollamaManager.isOllamaModelId(modelId)) {
    return ollamaManager.getLanguageModel(modelId);
  }

  return gateway.languageModel(modelId);
}
