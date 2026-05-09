"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { chatModels } from "@/lib/ai/models";
import { ollamaManager } from "@/lib/ai/ollama";
import { titlePrompt } from "@/lib/ai/prompts";
import { getLanguageModel, myProvider } from "@/lib/ai/providers";
import { isTestEnvironment } from "@/lib/constants";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
  modelId,
}: {
  message: UIMessage;
  modelId: string;
}) {
  const isOllama = ollamaManager.isOllamaModelId(modelId);
  const modelConfig = chatModels.find((m) => m.id === modelId);

  const model =
    isTestEnvironment && myProvider
      ? myProvider.languageModel("title-model")
      : getLanguageModel(modelId);

  const { text } = await generateText({
    model,
    system: titlePrompt,
    prompt: getTextFromMessage(message),
    ...(!isOllama && modelConfig?.gatewayOrder
      ? {
          providerOptions: {
            gateway: { order: modelConfig.gatewayOrder },
          },
        }
      : {}),
  });
  return text
    .replace(/^[#*"\s]+/, "")
    .replace(/["]+$/, "")
    .trim();
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [message] = await getMessageById({ id });
  if (!message) {
    throw new Error("Message not found");
  }

  const chat = await getChatById({ id: message.chatId });
  if (!chat || chat.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chat = await getChatById({ id: chatId });
  if (!chat || chat.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await updateChatVisibilityById({ chatId, visibility });
}
