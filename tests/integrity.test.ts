import { describe, expect, it } from "vitest";
import { buildDemoProject } from "@/lib/buildwise";
import { executeProviderTest } from "@/lib/provider-adapters";

describe("product integrity", () => {
  it("generates task-specific prompt packages without forced savings", () => {
    const project = buildDemoProject();
    const prompts = project.prompts;
    expect(new Set(prompts.map((prompt) => prompt.optimisedPrompt)).size).toBeGreaterThan(1);
    expect(prompts.every((prompt) => prompt.optimisedPromptTokens && prompt.estimationMethod)).toBe(true);
    expect(prompts.find((prompt) => prompt.id === "policy")?.optimisedPrompt).toContain("top-k");
    expect(prompts.some((prompt) => (prompt.percentageChange ?? 0) > 0)).toBe(true);
  });

  it("labels mock results with explicit provenance and projection fields", async () => {
    const result = await executeProviderTest(
      { id: "demo", kind: "openai-compatible", displayName: "Demo", model: "gpt-4o-mini", requiresKey: false, keyLabel: "No key required" },
      { prompt: "Return JSON", taskName: "Triage", structuredOutput: true, mode: "mock" },
    );
    expect(result.provenance).toBe("mock-adapter");
    expect(result.pricingSource).toBe("Demo catalogue pricing");
    expect(result.projectedMonthlyCost).toBeGreaterThanOrEqual(0);
    expect(result.warnings.join(" ")).toContain("No paid provider call");
  });

  it("uses canonical expected-token math and honest scenario labels", () => {
    const project = buildDemoProject();
    const economy = project.scenarios.find((scenario) => scenario.id === "economy");
    const balanced = project.scenarios.find((scenario) => scenario.id === "balanced");
    const prompt = project.prompts.find((item) => item.id === "triage");
    expect(economy?.savingsVsBaseline).toBe(99.6);
    expect(balanced?.premiumModelShare).toBe(0);
    expect(balanced?.summary).not.toContain("advanced reasoning");
    expect(prompt?.originalExpectedTokens).toBeGreaterThan(0);
    expect(prompt?.optimisedExpectedTokens).toBeGreaterThan(0);
    expect(prompt?.netTokenDelta).toBe(prompt!.optimisedExpectedTokens! - prompt!.originalExpectedTokens!);
    expect(prompt?.estimatedTokenDifference).toContain("expected tokens per request");
  });
});
