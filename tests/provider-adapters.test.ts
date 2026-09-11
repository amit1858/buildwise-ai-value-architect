import { afterEach, describe, expect, it, vi } from "vitest";
import { modelCatalogue, type ProviderConfig } from "@/lib/buildwise";
import { NVIDIA_BUILD_CHAT_COMPLETIONS_URL, NVIDIA_BUILD_DEFAULT_MODEL } from "@/lib/model-registry";
import { executeProviderTest, getNvidiaChatCompletionsUrl, validateProviderConfiguration } from "@/lib/provider-adapters";

const providers: ProviderConfig[] = [
  { id: "azure", kind: "azure-openai", displayName: "Azure", endpoint: "https://azure.example", deployment: "gpt-4.1-mini", apiKey: "secret", requiresKey: true, keyLabel: "API key" },
  { id: "openai", kind: "openai", displayName: "OpenAI", endpoint: "https://api.example/v1", model: "gpt-4o-mini", apiKey: "secret", requiresKey: true, keyLabel: "API key" },
  { id: "anthropic", kind: "anthropic", displayName: "Anthropic", endpoint: "https://anthropic.example/v1", model: "claude-3-5-haiku", apiKey: "secret", requiresKey: true, keyLabel: "API key" },
  { id: "nvidia", kind: "nvidia", displayName: "NVIDIA", endpoint: "https://integrate.api.nvidia.com", model: NVIDIA_BUILD_DEFAULT_MODEL, apiKey: "secret", requiresKey: true, keyLabel: "API key" },
  { id: "compatible", kind: "openai-compatible", displayName: "Compatible", endpoint: "https://gateway.example/v1", model: "custom-model", apiKey: "secret", requiresKey: true, keyLabel: "API key" },
  { id: "ollama", kind: "ollama", displayName: "Ollama", endpoint: "http://localhost:11434", model: "llama3.1:8b", requiresKey: false, keyLabel: "No key required" },
];

afterEach(() => vi.restoreAllMocks());

describe("provider adapters", () => {
  it("executes a contract-accurate mocked response for every supported provider", async () => {
    for (const provider of providers) {
      const result = await executeProviderTest(provider, { prompt: "Return a JSON status.", taskName: "Test", structuredOutput: true, mode: "mock" });
      expect(result.status).toBe("success");
      expect(result.isStructuredValid).toBe(true);
      expect(result.warnings[0]).toContain("Mocked provider response");
      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.actualCost === null || result.actualCost >= 0).toBe(true);
    }
  });

  it("captures provider-reported OpenAI usage and calculates cost from the catalog", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      id: "chatcmpl-test",
      model: "gpt-4o-mini",
      choices: [{ finish_reason: "stop", message: { role: "assistant", content: "{\"status\":\"ok\"}" } }],
      usage: { prompt_tokens: 1000, completion_tokens: 200, prompt_tokens_details: { cached_tokens: 100 } },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const result = await executeProviderTest(providers[1], { prompt: "Return JSON.", structuredOutput: true, mode: "live" });
    expect(result.inputTokens).toBe(1000);
    expect(result.outputTokens).toBe(200);
    expect(result.actualCost).toBeGreaterThan(0);
    expect(result.content).toContain("\"status\"");
  });

  it("validates an OpenAI-compatible endpoint from its models contract", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: [{ id: "custom-model" }] }), { status: 200 })));
    const result = await validateProviderConfiguration(providers[4]);
    expect(result.ok).toBe(true);
    expect(result.status).toBe("Connected");
    expect(result.detectedModel).toBe("custom-model");
  });

  it("uses the current NVIDIA Build model and official chat completions endpoint", async () => {
    expect(getNvidiaChatCompletionsUrl("https://integrate.api.nvidia.com")).toBe(NVIDIA_BUILD_CHAT_COMPLETIONS_URL);
    expect(getNvidiaChatCompletionsUrl("https://integrate.api.nvidia.com/v1")).toBe(NVIDIA_BUILD_CHAT_COMPLETIONS_URL);
    expect(modelCatalogue.some((model) => model.modelId === NVIDIA_BUILD_DEFAULT_MODEL)).toBe(true);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ model: NVIDIA_BUILD_DEFAULT_MODEL, choices: [{ finish_reason: "stop", message: { role: "assistant", content: "{\"fallback\":false}" } }], usage: { prompt_tokens: 111, completion_tokens: 22 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await executeProviderTest(providers[3], { prompt: "Return JSON.", structuredOutput: true, mode: "live" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { model: string; stream: boolean; top_p: number };
    expect(url).toBe(NVIDIA_BUILD_CHAT_COMPLETIONS_URL);
    expect(body).toMatchObject({ model: NVIDIA_BUILD_DEFAULT_MODEL, stream: false, top_p: 0.95 });
    expect(result.provenance).toBe("live-provider");
  });

  it("classifies NVIDIA validation failures without exposing raw upstream errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "model_not_found", message: "unsafe upstream detail" } }), { status: 404 })));
    const result = await validateProviderConfiguration(providers[3]);
    expect(result).toMatchObject({ ok: false, status: "Connection failed", detectedModel: NVIDIA_BUILD_DEFAULT_MODEL });
    expect(result.message).not.toContain("model_not_found");
    expect(result.message).not.toContain("unsafe upstream detail");
  });
});
