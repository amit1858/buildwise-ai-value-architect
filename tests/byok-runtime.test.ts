import { describe, expect, it, vi } from "vitest";
import type { ProviderConfig } from "@/lib/buildwise";
import { executeProviderTest } from "@/lib/provider-adapters";

const nvidia: ProviderConfig = { id: "nvidia", kind: "nvidia", displayName: "NVIDIA", endpoint: "https://integrate.api.nvidia.com/v1", model: "nvidia/nemotron-3.5-lightning-30b-a3b", apiKey: "session-only-test-key", requiresKey: true, keyLabel: "API key" };

describe("BYOK runtime boundaries", () => {
  it("does not invent usage or cost when a live provider omits usage metadata", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ model: nvidia.model, choices: [{ message: { content: "ok" } }] }), { status: 200 })));
    const result = await executeProviderTest(nvidia, { prompt: "Reply briefly.", mode: "live" });
    expect(result).toMatchObject({ provenance: "live-provider", usageReported: false, actualCost: null });
    expect(result.usageSummary).toBe("Provider did not report token usage.");
  });

  it("returns a sanitized request identifier without returning credentials", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "request-safe-id", model: nvidia.model, choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 5, completion_tokens: 3 } }), { status: 200 })));
    const result = await executeProviderTest(nvidia, { prompt: "Reply briefly.", mode: "live" });
    expect(result.requestId).toBe("request-safe-id");
    expect(JSON.stringify(result)).not.toContain(nvidia.apiKey ?? "");
  });

  it("keeps simulated demo execution distinct from live-provider execution", async () => {
    const result = await executeProviderTest(nvidia, { prompt: "Reply briefly.", mode: "mock" });
    expect(result).toMatchObject({ provenance: "mock-adapter", usageReported: true });
  });
});
