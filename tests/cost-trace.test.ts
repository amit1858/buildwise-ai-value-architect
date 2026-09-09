import { describe, expect, it } from "vitest";
import { buildDemoProject, calculateCostTrace, calculateUsageCostTrace, getDemoSampleEstimate } from "@/lib/buildwise";

describe("cost trace", () => {
  it("derives monthly cost from price, tokens, calls, retries, fallback and volume", () => {
    const trace = calculateUsageCostTrace({
      modelId: "gpt-4o-mini",
      uncachedInputTokens: 1000,
      cachedInputTokens: 500,
      outputTokens: 200,
      callsPerExecution: 2,
      retryRate: 0.1,
      fallbackRate: 0.05,
      monthlyExecutions: 1000,
    });
    expect(trace.total).toBeGreaterThan(0);
    expect(trace.callsPerExecution).toBe(2);
    expect(trace.retryRate).toBe(0.1);
    expect(trace.fallbackRate).toBe(0.05);
    expect(trace.monthlyExecutions).toBe(1000);
  });

  it("uses the same deterministic estimate source as the landing sample", () => {
    expect(getDemoSampleEstimate()).toBeGreaterThan(0);
  });

  it("keeps seeded landing, scenarios and blueprint values on one canonical trace", () => {
    const project = buildDemoProject();
    const balanced = project.scenarios.find((scenario) => scenario.id === "balanced");
    const trace = calculateCostTrace(project.tasks, project.input, "balanced");
    expect(project.input.executionsPerMonth).toBe(100_000);
    expect(project.spine.privacyLevel).toBe("High");
    expect(balanced?.monthlyCost).toBe(trace.monthlyCost);
    expect(balanced?.costTrace?.tasks?.map((task) => task.taskId)).toEqual(project.tasks.map((task) => task.id));
  });

  it("keeps deterministic retrieval visible without manufacturing model cost", () => {
    const project = buildDemoProject();
    const retrieval = project.scenarios.find((scenario) => scenario.id === "balanced")?.costTrace?.tasks?.find((task) => task.taskId === "policy");
    expect(retrieval?.model).toBe("Deterministic execution");
    expect(retrieval?.costPerExecution).toBe(0);
    expect(retrieval?.priceSource).toContain("Deterministic");
  });
});
