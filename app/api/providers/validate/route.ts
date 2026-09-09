import { sanitizeProviderError, validateProviderConfiguration } from "@/lib/provider-adapters";
import type { ProviderConfig } from "@/lib/buildwise";

export async function POST(request: Request) {
  if (process.env.PUBLIC_DEMO === "true") {
    return Response.json({ ok: false, status: "Connection failed", message: "Public demo mode does not validate provider credentials." }, { status: 403 });
  }
  try {
    const payload = (await request.json()) as { provider?: ProviderConfig };
    const provider = payload.provider;

    if (!provider || !provider.id || !provider.kind) {
      return Response.json({ ok: false, message: "Provider configuration is incomplete." }, { status: 400 });
    }

    const result = await validateProviderConfiguration({
      ...provider,
      apiKey: provider.apiKey ?? "",
    });

    return Response.json(result);
  } catch (error) {
    const message = sanitizeProviderError(error);
    return Response.json({ ok: false, status: "Connection failed", message }, { status: 500 });
  }
}
