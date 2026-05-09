import { getAllGatewayModels, getCapabilities, isDemo } from "@/lib/ai/models";
import { ollamaManager } from "@/lib/ai/ollama";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=300, s-maxage=300",
  };

  const curatedCapabilities = await getCapabilities();
  const ollamaModels = await ollamaManager.listAllModels();
  const ollamaCapabilities = ollamaManager.capabilitiesForAll(
    ollamaModels.map((m) => m.id)
  );
  const capabilities = { ...curatedCapabilities, ...ollamaCapabilities };

  if (isDemo) {
    const models = [...(await getAllGatewayModels()), ...ollamaModels];
    return Response.json({ capabilities, models }, { headers });
  }

  if (ollamaModels.length > 0) {
    return Response.json({ capabilities, models: ollamaModels }, { headers });
  }

  return Response.json(curatedCapabilities, { headers });
}
