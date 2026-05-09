import { z } from "zod";
import { probeMcpServer } from "@/lib/ai/mcp/client";

const probeRequestSchema = z.object({
  url: z.string().url(),
  type: z.enum(["http", "sse"]).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = probeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const result = await probeMcpServer(parsed.data);
  return Response.json(result);
}
