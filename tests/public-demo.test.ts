import { describe, expect, it } from "vitest";
import { executeProviderTest } from "@/lib/provider-adapters";

describe("public demo controlled execution", () => {
  it("uses the mock adapter without provider network access", async () => {
    const result = await executeProviderTest(
      {
        id: "demo",
        kind: "openai-compatible",
        displayName: "BuildWise Demo",
        model: "gpt-4o-mini",
        requiresKey: false,
        keyLabel: "No key required",
        status: "Connected",
      },
      {
        taskName: "Case triage",
        prompt: "Classify this support case.",
        mode: "mock",
        structuredOutput: true,
      },
    );

    expect(result.provenance).toBe("mock-adapter");
    expect(result.warnings).toContain("Mocked provider response. No paid provider call was made.");
    expect(result.status).toBe("success");
  });
});
