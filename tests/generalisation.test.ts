import { beforeEach, describe, expect, it } from "vitest";
import { buildProjectFromForm, convertWorkloadToTokens, getRoutingPatchForModel, recalculateProjectFromTasks } from "@/lib/buildwise";
import { generateBuildArtifacts } from "@/lib/build-artifacts";
import { scenarioFixtures } from "@/lib/scenario-fixtures";
import { createBlankProjectState, createDemoProjectState, getLatestDraft, loadProjectState, migrateLegacyBrowserState, saveDraftState } from "@/lib/project-state";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

beforeEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: new MemoryStorage() } });
});

describe("versioned project state", () => {
  it("creates isolated blank, draft, and demo states without fallback contamination", () => {
    const first = createBlankProjectState();
    const second = createBlankProjectState();
    expect(first.projectId).not.toBe(second.projectId);
    expect(first.intake.projectName).toBe("");
    expect(first.intake.problemStatement).toBe("");

    saveDraftState(first.projectId, { ...first.intake, projectName: "Independent draft" }, 2);
    const demo = createDemoProjectState();
    const restored = loadProjectState(first.projectId);
    expect(restored.ok && restored.state.intake.projectName).toBe("Independent draft");
    expect(demo.project?.input.problemStatement).toContain("support");
    expect(getLatestDraft()?.projectId).toBe(first.projectId);
    expect(loadProjectState("missing")).toMatchObject({ ok: false, reason: "missing" });
  });

  it("rejects malformed, obsolete, mismatched, and corrupt nested state without fallback", () => {
    const state = createBlankProjectState();
    const key = `buildwise.project.v2.${state.projectId}`;
    window.localStorage.setItem(key, "{broken");
    expect(loadProjectState(state.projectId)).toMatchObject({ ok: false, reason: "invalid" });

    window.localStorage.setItem(key, JSON.stringify({ ...state, schemaVersion: 1 }));
    expect(loadProjectState(state.projectId)).toMatchObject({ ok: false, reason: "obsolete" });

    const project = buildProjectFromForm(scenarioFixtures.accountsPayable, state.projectId);
    window.localStorage.setItem(key, JSON.stringify({ ...state, kind: "generated", project: { ...project, id: "different-id" } }));
    expect(loadProjectState(state.projectId)).toMatchObject({ ok: false, reason: "invalid" });

    window.localStorage.setItem(key, JSON.stringify({ ...state, kind: "generated", project: { ...project, tasks: [{ ...project.tasks[0], expectedRetryRate: 9 }] } }));
    expect(loadProjectState(state.projectId)).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("rejects an internally consistent project payload stored under another project's key", () => {
    const first = createBlankProjectState();
    const second = createBlankProjectState();
    const secondRaw = window.localStorage.getItem(`buildwise.project.v2.${second.projectId}`);
    expect(secondRaw).not.toBeNull();
    window.localStorage.setItem(`buildwise.project.v2.${first.projectId}`, secondRaw!);
    expect(loadProjectState(first.projectId)).toMatchObject({ ok: false, reason: "invalid" });
    expect(loadProjectState(second.projectId)).toMatchObject({ ok: true });
  });

  it("migrates each legacy source independently and preserves malformed sources", () => {
    const project = buildProjectFromForm(scenarioFixtures.industrialMaintenance, "legacy-valid");
    window.localStorage.setItem("buildwise-projects", JSON.stringify([project]));
    window.localStorage.setItem("buildwise-intake-draft", "{malformed");
    migrateLegacyBrowserState();
    expect(loadProjectState("legacy-valid").ok).toBe(true);
    expect(window.localStorage.getItem("buildwise-projects")).toBeNull();
    expect(window.localStorage.getItem("buildwise-intake-draft")).toBe("{malformed");
    expect(window.localStorage.getItem("buildwise.project.migrated.v2")).toBeNull();

    window.localStorage.clear();
    window.localStorage.setItem("buildwise-projects", "{malformed");
    window.localStorage.setItem("buildwise-intake-draft", JSON.stringify({ projectName: "Recoverable draft", problemStatement: "Keep this valid draft." }));
    migrateLegacyBrowserState();
    expect(getLatestDraft()?.intake.projectName).toBe("Recoverable draft");
    expect(window.localStorage.getItem("buildwise-intake-draft")).toBeNull();
    expect(window.localStorage.getItem("buildwise-projects")).toBe("{malformed");
    expect(window.localStorage.getItem("buildwise.project.migrated.v2")).toBeNull();
  });
});

describe("general-purpose deterministic planning", () => {
  it("uses transparent unit conversions", () => {
    expect(convertWorkloadToTokens(100, "tokens")).toBe(100);
    expect(convertWorkloadToTokens(100, "words")).toBe(133);
    expect(convertWorkloadToTokens(2, "pages")).toBe(1000);
    expect(convertWorkloadToTokens(400, "characters")).toBe(100);
  });

  it("satisfies all six scenario invariants and produces distinct structures", () => {
    const projects = Object.entries(scenarioFixtures).map(([id, input]) => [id, buildProjectFromForm(input, id)] as const);
    const byId = Object.fromEntries(projects);
    expect(byId.pharmaceutical.tasks.some((task) => /specialist/i.test(task.humanReviewPolicy))).toBe(true);
    expect(byId.pharmaceutical.tasks.find((task) => task.id === "reportability-gate")?.needsLLM).toBe(false);
    expect(byId.accountsPayable.tasks.some((task) => task.taskType === "Calculation" && !task.needsLLM)).toBe(true);
    expect(byId.industrialMaintenance.tasks.some((task) => /technician approval is mandatory/i.test(task.humanReviewPolicy))).toBe(true);
    expect(byId.accountResearch.tasks.some((task) => /citation.*freshness/i.test(`${task.purpose} ${task.humanReviewPolicy}`))).toBe(true);
    expect(byId.payrollTax.suitability?.classification).toBe("deterministic");
    expect(byId.payrollTax.tasks.find((task) => task.id === "tax-calculation")?.needsLLM).toBe(false);
    expect(new Set(projects.map(([, project]) => project.tasks.map((task) => task.id).join(","))).size).toBe(6);
    expect(new Set(projects.map(([, project]) => project.prompts.map((prompt) => prompt.optimisedPrompt).join("|"))).size).toBe(6);
  });

  it("recalculates economics after routing edits and keeps exports project-specific", () => {
    const invoice = buildProjectFromForm(scenarioFixtures.accountsPayable, "invoice");
    const changedTasks = invoice.tasks.map((task) => task.needsLLM ? { ...task, estimatedInputTokens: task.estimatedInputTokens * 2 } : task);
    const recalculated = recalculateProjectFromTasks(invoice, changedTasks);
    expect(recalculated.scenarios.find((item) => item.id === "balanced")?.monthlyCost).not.toBe(invoice.scenarios.find((item) => item.id === "balanced")?.monthlyCost);

    for (const [id, input] of Object.entries(scenarioFixtures)) {
      if (id === "customerSupport") continue;
      const output = generateBuildArtifacts(buildProjectFromForm(input, id)).map((artifact) => artifact.content).join("\n");
      expect(output).toContain(input.projectName);
      expect(output).not.toContain("Customer message, history, and route metadata");
      expect(output).not.toContain("billing, access, product, delivery, policy");
    }
  });

  it("preserves edited call, retry, and model routing in scenario economics", () => {
    const project = buildProjectFromForm(scenarioFixtures.accountResearch, "routing-edits");
    const index = project.tasks.findIndex((task) => task.needsLLM);
    expect(index).toBeGreaterThanOrEqual(0);
    const original = project.scenarios.find((item) => item.id === "balanced")!.monthlyCost;
    const calls = recalculateProjectFromTasks(project, project.tasks.map((task, taskIndex) => taskIndex === index ? { ...task, expectedCallsPerExecution: task.expectedCallsPerExecution * 2 } : task));
    const retries = recalculateProjectFromTasks(project, project.tasks.map((task, taskIndex) => taskIndex === index ? { ...task, expectedRetryRate: Math.min(0.9, task.expectedRetryRate + 0.25) } : task));
    const model = recalculateProjectFromTasks(project, project.tasks.map((task, taskIndex) => taskIndex === index ? { ...task, primaryModel: "gpt-4.1" } : task));
    expect(calls.scenarios.find((item) => item.id === "balanced")!.monthlyCost).toBeGreaterThan(original);
    expect(retries.scenarios.find((item) => item.id === "balanced")!.monthlyCost).toBeGreaterThan(original);
    expect(model.scenarios.find((item) => item.id === "balanced")!.monthlyCost).not.toBe(original);
    expect(model.tasks[index].primaryModel).toBe("gpt-4.1");
  });

  it("maintains complete routing invariants for model-only changes and recalculates economics", () => {
    const project = buildProjectFromForm(scenarioFixtures.accountsPayable, "model-routing");
    const deterministicIndex = project.tasks.findIndex((task) => task.id === "arithmetic");
    const llmIndex = project.tasks.findIndex((task) => task.id === "document-capture");
    const originalCost = project.scenarios.find((item) => item.id === "balanced")!.monthlyCost;

    const promotedPatch = getRoutingPatchForModel(project.tasks[deterministicIndex], "gpt-4.1");
    expect(promotedPatch).toMatchObject({ needsLLM: true, primaryProvider: "azure-openai", primaryModel: "gpt-4.1", expectedCallsPerExecution: 1 });
    const promoted = recalculateProjectFromTasks(project, project.tasks.map((task, index) => index === deterministicIndex ? { ...task, ...promotedPatch } : task));
    expect(promoted.scenarios.find((item) => item.id === "balanced")!.monthlyCost).toBeGreaterThan(originalCost);

    const deterministicPatch = getRoutingPatchForModel(project.tasks[llmIndex], "Deterministic retrieval");
    expect(deterministicPatch).toMatchObject({
      needsLLM: false, primaryProvider: "deterministic", primaryModel: "Deterministic retrieval",
      fallbackProvider: "deterministic", fallbackModel: "Human review", expectedCallsPerExecution: 0, expectedRetryRate: 0,
    });
    const demoted = recalculateProjectFromTasks(project, project.tasks.map((task, index) => index === llmIndex ? { ...task, ...deterministicPatch } : task));
    expect(demoted.scenarios.find((item) => item.id === "balanced")!.monthlyCost).toBeLessThan(originalCost);

    const llmPatch = getRoutingPatchForModel(project.tasks[llmIndex], "gpt-4o-mini");
    expect(llmPatch).toMatchObject({ needsLLM: true, primaryProvider: "openai", primaryModel: "gpt-4o-mini" });
    expect(recalculateProjectFromTasks(project, project.tasks.map((task, index) => index === llmIndex ? { ...task, ...llmPatch } : task)).scenarios.find((item) => item.id === "balanced")!.monthlyCost).not.toBe(originalCost);
  });

  it("derives materially different workflows for three unrelated unmatched functional intents", () => {
    const base = {
      ...scenarioFixtures.customerSupport,
      industry: "Professional services",
      currentProcess: "People read source documents and prepare a reviewed result.",
      sampleInput: "Several dated source documents with structured metadata.",
      attachedDocuments: 3,
      structuredOutput: true,
      citations: true,
      humanReview: true,
    };
    const contract = buildProjectFromForm({ ...base, projectName: "Commercial agreement review", problemStatement: "Compare contract clauses, obligations, terms, and redlines with an approved legal playbook.", businessOutcome: "Give counsel a cited deviation review." }, "contract");
    const clinical = buildProjectFromForm({ ...base, projectName: "Clinical note summarisation", problemStatement: "Summarize patient encounter notes and medical records into a source-linked longitudinal chronology.", businessOutcome: "Give clinicians a concise reviewed record summary." }, "clinical");
    const schedule = buildProjectFromForm({ ...base, projectName: "Workforce allocation planner", problemStatement: "Allocate workers to shifts under availability, skills, demand, and capacity constraints.", businessOutcome: "Publish an approved feasible schedule." }, "schedule");
    expect(contract.tasks.map((task) => task.id)).toContain("deviation-analysis");
    expect(clinical.tasks.map((task) => task.id)).toContain("timeline-assemble");
    expect(schedule.tasks.map((task) => task.id)).toContain("schedule-optimize");
    const projects = [contract, clinical, schedule];
    expect(new Set(projects.map((item) => item.tasks.map((task) => `${task.id}:${task.taskType}`).join("|"))).size).toBe(3);
    expect(new Set(projects.map((item) => item.prompts.map((prompt) => prompt.optimisedPrompt).join("|"))).size).toBe(3);
    expect(new Set(projects.map((item) => generateBuildArtifacts(item).map((artifact) => artifact.content).join("|"))).size).toBe(3);
  });

  it("makes advanced context, cache, load, concurrency, and latency assumptions material", () => {
    const base = { ...scenarioFixtures.accountsPayable, attachedDocuments: 0, averageAttachmentPages: 0, averageConversationTurns: 1, cachedContextPercent: 0, peakVolumeMultiplier: 1, peakConcurrency: 1, targetResponseSeconds: 30 };
    const baseline = buildProjectFromForm(base, "advanced-base");
    const metric = (project: ReturnType<typeof buildProjectFromForm>) => project.scenarios.find((item) => item.id === "balanced")!;
    const withAttachments = buildProjectFromForm({ ...base, attachedDocuments: 12, averageAttachmentPages: 8 }, "advanced-docs");
    const withTurns = buildProjectFromForm({ ...base, averageConversationTurns: 8 }, "advanced-turns");
    const withCache = buildProjectFromForm({ ...base, cachedContextPercent: 80 }, "advanced-cache");
    const withPeak = buildProjectFromForm({ ...base, peakVolumeMultiplier: 4 }, "advanced-peak");
    const withConcurrency = buildProjectFromForm({ ...base, peakConcurrency: 50 }, "advanced-concurrency");
    const withLatency = buildProjectFromForm({ ...base, targetResponseSeconds: 3 }, "advanced-latency");
    expect(metric(withAttachments).inputTokens).toBeGreaterThan(metric(baseline).inputTokens);
    expect(metric(withAttachments).modelCalls).toBeGreaterThan(metric(baseline).modelCalls);
    expect(metric(withTurns).inputTokens).toBeGreaterThan(metric(baseline).inputTokens);
    expect(metric(withTurns).modelCalls).toBeGreaterThan(metric(baseline).modelCalls);
    expect(metric(withCache).monthlyCost).toBeLessThan(metric(baseline).monthlyCost);
    expect(metric(withPeak).monthlyCost).toBeGreaterThan(metric(baseline).monthlyCost);
    expect(metric(withConcurrency).monthlyCost).toBeGreaterThan(metric(baseline).monthlyCost);
    expect(metric(withLatency).monthlyCost).toBeGreaterThan(metric(baseline).monthlyCost);
    expect(withPeak.spine.why.join(" ")).toContain("4 peak multiplier");
  });
});
