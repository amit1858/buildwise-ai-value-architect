import type { ProviderConfig } from "@/lib/buildwise";
import { executeProviderTest, sanitizeProviderError } from "@/lib/provider-adapters";

export async function POST(request: Request) {
  if (process.env.PUBLIC_DEMO === "true") {
    return Response.json({ ok: false, message: "Public demo mode disables live and provider-backed execution." }, { status: 403 });
  }
  try {
    const payload = (await request.json()) as {
      provider?: ProviderConfig;
      request?: {
        prompt: string;
        systemPrompt?: string;
        model?: string;
        maxOutputTokens?: number;
        temperature?: number;
        taskName?: string;
      };
    };

    if (!payload.provider || !payload.request || !payload.request.prompt) {
      return Response.json({ ok: false, message: "Missing provider or prompt details." }, { status: 400 });
    }

    const result = await executeProviderTest({
      ...payload.provider,
      apiKey: payload.provider.apiKey ?? "",
    }, payload.request);

    return Response.json({ ok: true, result });
  } catch (error) {
    const message = sanitizeProviderError(error);
    return Response.json({ ok: false, message }, { status: 500 });
  }
}
