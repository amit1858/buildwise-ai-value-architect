import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as testProvider } from "@/app/api/providers/test/route";
import { POST as validateProvider } from "@/app/api/providers/validate/route";

afterEach(() => vi.restoreAllMocks());

describe("provider API routes", () => {
  it("executes an explicit mocked controlled test through the route", async () => {
    const response = await testProvider(new Request("http://localhost/api/providers/test", {
      method: "POST",
      body: JSON.stringify({
        provider: { id: "demo", kind: "openai-compatible", displayName: "Demo", model: "gpt-4o-mini", requiresKey: false, keyLabel: "No key required" },
        request: { prompt: "Return JSON", taskName: "Triage", structuredOutput: true, mode: "mock" },
      }),
    }));
    const body = await response.json() as { ok: boolean; result?: { warnings: string[]; isStructuredValid: boolean } };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.result?.isStructuredValid).toBe(true);
    expect(body.result?.warnings[0]).toContain("Mocked provider response");
  });

  it("returns a sanitized validation failure for incomplete configuration", async () => {
    const response = await validateProvider(new Request("http://localhost/api/providers/validate", {
      method: "POST",
      body: JSON.stringify({ provider: { id: "openai", kind: "openai", displayName: "OpenAI" } }),
    }));
    const body = await response.json() as { ok: boolean; message?: string };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.message).toContain("API key");
  });

  it("blocks provider routes in public-demo mode", async () => {
    const original = process.env.PUBLIC_DEMO;
    process.env.PUBLIC_DEMO = "true";
    try {
      const response = await testProvider(new Request("http://localhost/api/providers/test", {
        method: "POST",
        body: JSON.stringify({ provider: { id: "demo", kind: "openai-compatible" }, request: { prompt: "x", mode: "mock" } }),
      }));
      expect(response.status).toBe(403);
    } finally {
      if (original === undefined) delete process.env.PUBLIC_DEMO;
      else process.env.PUBLIC_DEMO = original;
    }
  });
});
