"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildDemoProject, buildProjectFromForm, formatCost, formatMoney, getProjectNavigationSections, modelCatalogue, recalculateProjectFromTasks, type ControlledTestRecord, type Project, type ScenarioMetric, type WorkflowTask } from "@/lib/buildwise";
import { buildCompleteExportBundle, generateBuildArtifacts, generateCopilotInstructionsMarkdown, type BuildArtifact } from "@/lib/build-artifacts";
import { deleteProject, getProjectById, saveProject } from "@/lib/project-store";
import { getSessionProvider, readSessionProviderSettings } from "@/lib/provider-session";
import { executeProviderTest } from "@/lib/provider-adapters";
import { ThemeControl } from "@/components/ThemeControl";

export function WorkspaceShell({ projectId, section, publicDemo = false }: { projectId: string; section: string; publicDemo?: boolean }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("balanced");
  const [lastTest, setLastTest] = useState<ControlledTestRecord | null>(null);
  const [notice, setNotice] = useState<{ tone: "info" | "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    const loaded = getProjectById(projectId) ?? (projectId === "demo-support-project" ? buildDemoProject() : null);
    queueMicrotask(() => {
      setProject(loaded);
      setLastTest(loaded?.testRuns?.at(-1) ?? null);
    });
  }, [projectId]);

  const activeSection = section || "spine";
  const estimate = useMemo(() => project?.scenarios.find((item) => item.id === selectedScenario) ?? project?.scenarios[2] ?? null, [project, selectedScenario]);

  if (!project) {
    return <main className="bw-page p-10 text-stone-700">Project not found.</main>;
  }

  const updateProject = (updater: (current: Project) => Project) => {
    setProject((current) => {
      const next = updater(current!);
      saveProject(next);
      return next;
    });
  };

  const handleDelete = () => {
    deleteProject(project.id);
    router.push("/");
  };

  const runControlledTest = async (taskId: string, mode: "demo" | "mocked-byok" | "live-byok") => {
    const chosen = project.tasks.find((task) => task.id === taskId) ?? project.tasks[0];
    const configured = readSessionProviderSettings().find((provider) => provider.status === "Connected" && provider.isEnabledForSession);
    const provider = configured ? getSessionProvider(configured.id) : null;
    if (mode === "live-byok" && !provider) {
      setNotice({ tone: "error", message: "Live mode requires a successfully validated provider in this browser session." });
      return;
    }
    setNotice({ tone: "info", message: `Running one controlled ${mode === "demo" ? "demo" : "provider"} test for ${chosen.name}. No automatic paid calls are made.` });
    const demoProvider = provider ?? { id: "demo", kind: "openai-compatible" as const, displayName: "BuildWise Demo", model: chosen.primaryModel, requiresKey: false, keyLabel: "No key required", status: "Connected" as const };
    const request = {
      taskName: chosen.name,
      prompt: project.prompts.find((prompt) => prompt.id === chosen.id)?.optimisedPrompt ?? chosen.promptStrategy,
      systemPrompt: "Return a concise, schema-safe result.",
      model: chosen.primaryModel,
      maxOutputTokens: chosen.estimatedOutputTokens,
      structuredOutput: project.input.structuredOutput,
      mode: mode === "demo" ? "mock" as const : mode === "mocked-byok" ? "mock" as const : "live" as const,
    };
    let result: { providerId: string; model: string; content: string; inputTokens: number; outputTokens: number; cachedTokens: number; latencyMs: number; finishReason: string; actualCost: number | null; projectedMonthlyCost: number | null; pricingSource: string; provenance: "demo-simulation" | "mock-adapter" | "live-provider"; isStructuredValid: boolean; warnings: string[] };
    if (publicDemo && mode === "demo") {
      result = { ...await executeProviderTest(demoProvider, request), provenance: "demo-simulation" };
    } else {
      const response = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: demoProvider, request }),
      });
      const payload = (await response.json()) as { ok?: boolean; result?: typeof result; message?: string };
      if (!response.ok || !payload.ok || !payload.result) {
        setNotice({ tone: "error", message: payload.message ?? "Controlled test failed." });
        return;
      }
      result = payload.result;
    }
    const record: ControlledTestRecord = {
      providerId: result.providerId,
      model: result.model,
      actualInputTokens: result.inputTokens,
      actualOutputTokens: result.outputTokens,
      cachedTokens: result.cachedTokens,
      latencyMs: result.latencyMs,
      finishReason: result.finishReason,
      actualCost: result.actualCost,
      projectedMonthlyCost: result.projectedMonthlyCost,
      pricingSource: result.pricingSource,
      provenance: mode === "demo" ? "demo-simulation" : result.provenance,
      structuredValid: result.isStructuredValid,
      output: result.content,
      warnings: result.warnings,
      id: `test-${Date.now()}`,
      mode,
      providerName: provider?.displayName ?? "BuildWise Demo",
      taskId: chosen.id,
      estimatedInputTokens: chosen.estimatedInputTokens,
      estimatedOutputTokens: chosen.estimatedOutputTokens,
      createdAt: new Date().toISOString(),
    };
    setLastTest(record);
    setNotice({ tone: "success", message: `${record.provenance === "live-provider" ? "Provider test" : "Controlled demo test"} completed for ${chosen.name}.` });
    updateProject((current) => ({ ...current, testRuns: [...(current.testRuns ?? []), record], providerConfig: provider ? { ...provider, apiKey: "" } : current.providerConfig }));
  };

  return (
    <div className="bw-page min-h-screen bg-stone-100 text-stone-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="workspace-nav w-full border-b border-stone-200 bg-white p-4 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">BuildWise</div>
              <div className="mt-1 text-lg font-semibold text-stone-900">{project.name}</div>
            </div>
            <button onClick={handleDelete} className="rounded-full border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:border-stone-400">Delete</button>
          </div>

          <nav className="workspace-section-nav space-y-2">
            {getProjectNavigationSections().map((item) => (
              <Link
                key={item.id}
                href={`/workspace/${project.id}/${item.href}`}
                className={activeSection === item.href ? "flex items-center justify-between rounded-xl bg-stone-900 px-3 py-2.5 text-sm font-medium text-white" : "flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-400"}
              >
                <span>{item.label}</span>
                <span className="text-xs opacity-80">→</span>
              </Link>
            ))}
          </nav>

          <div className="workspace-status mt-8 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Status</div>
            <div className="mt-3 text-sm text-stone-700">Provider status: demo</div>
            <div className="mt-1 text-sm text-stone-700">Budget: {project.input.monthlyBudget ? formatMoney(project.input.monthlyBudget) : "Not set"}</div>
          </div>
        </aside>

        <main id="main-content" className="workspace-main min-w-0 flex-1 p-4 md:p-8">
          <header className="mb-6 flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Workspace</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-stone-900">{project.spine.workloadCategory}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <ThemeControl />
              <button onClick={() => updateProject((current) => ({ ...current, name: current.name }))} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-500">Preset: demo</button>
              <Link href="/settings/providers" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-500">Providers</Link>
              <button onClick={() => downloadBlueprint(project, estimate)} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Export blueprint</button>
            </div>
          </header>

          {notice && (
            <div
              role={notice.tone === "error" ? "alert" : "status"}
              className={
                notice.tone === "error"
                  ? "mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  : notice.tone === "success"
                    ? "mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    : "mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              }
            >
              {notice.message}
            </div>
          )}

          {activeSection === "spine" && <SpinePanel project={project} />}
          {activeSection === "suitability" && <SuitabilityPanel project={project} />}
          {activeSection === "build-path" && <BuildPathPanel project={project} onSelect={(pathId) => updateProject((current) => ({ ...current, recommendedBuildPath: pathId, updatedAt: new Date().toISOString() }))} />}
          {activeSection === "workflow" && <WorkflowPanel project={project} onUpdate={(next) => updateProject((current) => recalculateProjectFromTasks(current, next.tasks))} />}
          {activeSection === "scenarios" && <ScenariosPanel project={project} selectedScenario={selectedScenario} onSelect={setSelectedScenario} />}
          {activeSection === "prompts" && <PromptPanel project={project} />}
          {activeSection === "test" && <TestPanel project={project} lastTest={lastTest} publicDemo={publicDemo} onRun={runControlledTest} onFeedback={(feedback) => {
            if (!lastTest) return;
            const updated = { ...lastTest, feedback };
            setLastTest(updated);
            updateProject((current) => {
              const testRuns = (current.testRuns ?? []).map((run) => run.id === updated.id ? updated : run);
              const accepted = feedback === "accepted";
              const inputMultiplier = accepted ? (current.calibration?.inputMultiplier ?? 1) * 0.8 + (lastTest.actualInputTokens / Math.max(1, lastTest.estimatedInputTokens)) * 0.2 : (current.calibration?.inputMultiplier ?? 1);
              const outputMultiplier = accepted ? (current.calibration?.outputMultiplier ?? 1) * 0.8 + (lastTest.actualOutputTokens / Math.max(1, lastTest.estimatedOutputTokens)) * 0.2 : (current.calibration?.outputMultiplier ?? 1);
              return { ...current, testRuns, calibration: { inputMultiplier, outputMultiplier, sampleCount: (current.calibration?.sampleCount ?? 0) + (accepted ? 1 : 0), updatedAt: new Date().toISOString() } };
            });
          }} />}
          {activeSection === "blueprint" && <BlueprintPanel project={project} estimate={estimate} />}
          {activeSection === "build-kit" && <BuildKitPanel project={project} estimate={estimate} />}
        </main>

        <aside className="workspace-context w-full border-t border-stone-200 bg-white p-4 lg:w-80 lg:border-l lg:border-t-0">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Context</div>
          <div className="space-y-4 text-sm text-stone-600">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="font-medium text-stone-900">Use case summary</div>
              <div className="mt-2 leading-6">{project.input.problemStatement}</div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="font-medium text-stone-900">Why BuildWise classified it this way</div>
              <ul className="mt-2 space-y-2 leading-6">
                {project.spine.why.map((reason) => <li key={reason}>• {reason}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="font-medium text-stone-900">Assumptions</div>
              <ul className="mt-2 space-y-2 leading-6">
                <li>• {project.input.executionsPerMonth.toLocaleString("en-US")} monthly executions.</li>
                <li>• {project.input.qualitySensitivity} quality sensitivity.</li>
                <li>• {project.input.latencyTarget} latency target.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SuitabilityPanel({ project }: { project: Project }) {
  const deterministic = project.tasks.filter((task) => !task.needsLLM).length;
  const human = project.tasks.filter((task) => task.humanReviewPolicy !== "Never").length;
  const classification = project.input.qualitySensitivity === "critical" || project.input.dataSensitivity === "regulated" ? "Hybrid AI plus human review" : deterministic >= 2 ? "Search/retrieval with selective language-model assistance" : "General-purpose language model with governance controls";
  return <div className="space-y-6">
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">AI suitability assessment</div><h3 className="mt-3 text-2xl font-semibold text-stone-900">{classification}</h3><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">BuildWise separates deterministic rules, retrieval, model-assisted work, and human decisions before selecting a model or build path.</p></div>
    <div className="grid gap-4 md:grid-cols-3"><MetricCard label="Deterministic tasks" value={`${deterministic} of ${project.tasks.length}`} /><MetricCard label="Human-review gates" value={`${human} of ${project.tasks.length}`} /><MetricCard label="Quality sensitivity" value={project.input.qualitySensitivity} /></div>
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div className="text-sm font-semibold text-stone-900">Decision rule</div><p className="mt-2 text-sm leading-6 text-stone-600">Use deterministic execution where confidence is high, retrieval before generation, and explicit human review for consequential outcomes. Model choice follows the task contract rather than the other way around.</p></div>
  </div>;
}

function BuildPathPanel({ project, onSelect }: { project: Project; onSelect: (pathId: NonNullable<Project["recommendedBuildPath"]>) => void }) {
  const paths = project.buildPaths ?? [];
  return <div className="space-y-6">
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Choose build path</div><h3 className="mt-3 text-2xl font-semibold text-stone-900">Build path recommendation</h3><p className="mt-2 text-sm text-stone-600">Compare delivery speed, control, governance, and ownership before committing to a platform or runtime.</p></div>
    <div className="grid gap-4 lg:grid-cols-3">{paths.map((path) => <div key={path.id} className={`rounded-2xl border p-5 shadow-sm ${path.id === project.recommendedBuildPath ? "bw-surface-selected" : "border-stone-200 bg-white text-stone-900"}`}><div className="flex items-center justify-between"><h4 className="bw-text-primary text-lg font-semibold">{path.label}</h4><span className="bw-text-primary text-sm font-semibold">{path.fitScore}% fit</span></div><p className="bw-text-secondary mt-3 text-sm leading-6">{path.summary}</p><div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{path.id === project.recommendedBuildPath ? "Selected recommendation" : "Alternative"}</div><ul className="mt-3 space-y-2 text-sm">{path.strengths.map((item) => <li key={item}>+ {item}</li>)}</ul><div className="mt-4 text-xs leading-5 opacity-80">Trade-off: {path.tradeoffs[0]}</div><button type="button" onClick={() => onSelect(path.id)} className={path.id === project.recommendedBuildPath ? "bw-action-secondary mt-5 rounded-full border px-4 py-2 text-sm font-medium" : "bw-action-primary mt-5 rounded-full px-4 py-2 text-sm font-medium"}>{path.id === project.recommendedBuildPath ? "Selected" : "Use this path"}</button></div>)}</div>
  </div>;
}

function BuildKitPanel({ project, estimate }: { project: Project; estimate: ScenarioMetric | null }) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>("executive-brief");
  const artifacts = useMemo<BuildArtifact[]>(() => generateBuildArtifacts(project, estimate?.id ?? "balanced"), [project, estimate]);
  const selectedArtifact = artifacts.find((artifact) => artifact.id === selectedArtifactId) ?? artifacts[0];

  const downloadBlob = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportBundle = buildCompleteExportBundle(project, estimate?.id ?? "balanced");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Build kit</div>
        <h3 className="mt-3 text-2xl font-semibold text-stone-900">Project artifact pack</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">Each artifact is generated from the current project state, selected scenario, and recommended build path. Public-demo exports remain credential-free.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => navigator.clipboard?.writeText(selectedArtifact.content)} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">Copy selected artifact</button>
          <button onClick={() => downloadBlob(selectedArtifact.content, selectedArtifact.fileName)} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Download selected artifact</button>
          <button onClick={() => downloadBlob(exportBundle.combinedMarkdown, exportBundle.fileName)} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Download complete Build Kit</button>
          <button onClick={() => downloadBlob(generateCopilotInstructionsMarkdown(project), ".github/copilot-instructions.md")} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Download .github/copilot-instructions.md</button>
          <button onClick={() => downloadBlob(artifacts.find((artifact) => artifact.id === "github-copilot-agent-prompt")?.content ?? "", "13-github-copilot-agent-prompt.md")} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Download GitHub Copilot prompt</button>
          <button onClick={() => downloadBlob(artifacts.find((artifact) => artifact.id === "low-code-implementation-guide")?.content ?? "", "14-low-code-implementation-guide.md")} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Low-code guide</button>
          <button onClick={() => downloadBlob(artifacts.find((artifact) => artifact.id === "pro-code-implementation-guide")?.content ?? "", "15-pro-code-implementation-guide.md")} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Pro-code guide</button>
          <button onClick={() => downloadBlob(artifacts.find((artifact) => artifact.id === "hybrid-responsibility-map")?.content ?? "", "16-hybrid-responsibility-map.md")} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Hybrid responsibility map</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Artifacts</div>
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <button
                key={artifact.id}
                type="button"
                onClick={() => setSelectedArtifactId(artifact.id)}
                className={selectedArtifact?.id === artifact.id ? "w-full rounded-xl bg-stone-900 px-3 py-3 text-left text-sm font-medium text-white" : "w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-left text-sm font-medium text-stone-700 hover:border-stone-400"}
              >
                <div>{artifact.label}</div>
                <div className={selectedArtifact?.id === artifact.id ? "mt-1 text-[10px] uppercase tracking-[0.15em] text-stone-200" : "bw-text-secondary mt-1 text-[10px] uppercase tracking-[0.15em]"}>{artifact.fileName}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Selected artifact</div>
              <h4 className="mt-2 text-2xl font-semibold text-stone-900">{selectedArtifact.label}</h4>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{selectedArtifact.sourceScenario}</div>
          </div>
          <div className="mb-5 grid gap-2 text-xs text-stone-600 sm:grid-cols-3">
            <div>Project: {selectedArtifact.projectName}</div>
            <div>Build path: {selectedArtifact.buildPath}</div>
            <div>Provenance: {selectedArtifact.provenance}</div>
          </div>
          <pre className="whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700">{selectedArtifact.content}</pre>
        </div>
      </div>
    </div>
  );
}

function SpinePanel({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Workload spine</div>
        <h3 className="mt-3 text-2xl font-semibold text-stone-900">The canonical decision record</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">This deterministic classification explains the recommended controls and feeds every route, cost trace, scenario and Build Kit artifact. Editing the workflow recalculates economics without rewriting the original business constraints.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Workload category" value={project.spine.workloadCategory} />
        <MetricCard label="Overall complexity" value={project.spine.overallComplexity} />
        <MetricCard label="Reasoning depth" value={project.spine.reasoningDepth} />
        <MetricCard label="Privacy level" value={project.spine.privacyLevel} />
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">Deterministic controls and classification</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 font-medium text-stone-900">Recommended controls</div>
            <ul className="space-y-2 text-sm text-stone-600">
              {project.spine.deterministicControls.map((control) => <li key={control}>• {control}</li>)}
            </ul>
          </div>
          <div>
            <div className="mb-2 font-medium text-stone-900">MVP wedge</div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">{project.spine.mvpWedge}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowPanel({ project, onUpdate }: { project: Project; onUpdate: (project: Project) => void }) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(project.tasks[0]?.id ?? null);
  const providerModels = modelCatalogue.map((model) => model.modelId);
  const updateTask = (taskId: string, patch: Partial<WorkflowTask>) => {
    onUpdate({ ...project, tasks: project.tasks.map((task) => task.id === taskId ? { ...task, ...patch } : task) });
  };
  const restoreRecommendation = () => onUpdate(buildProjectFromForm(project.input, project.id));
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">Editable routing decomposition</div><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Each task shows what is deterministic, what needs a model, the selected execution method and its token allowance. Edits update all four policies and exported artifacts.</p></div>
        <button type="button" onClick={restoreRecommendation} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">Restore BuildWise recommendation</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="pb-3 pr-4 font-medium">Task</th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th className="pb-3 pr-4 font-medium">Model</th>
              <th className="pb-3 pr-4 font-medium">Method</th>
              <th className="pb-3 pr-4 font-medium">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {project.tasks.map((task) => (
              <tr key={task.id} className="border-b border-stone-200 align-top">
                <td className="py-4 pr-4 font-medium text-stone-900">
                  <button type="button" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="mr-2 rounded border border-stone-300 px-2 py-1 text-xs">{expandedTaskId === task.id ? "-" : "+"}</button>
                  <input aria-label={`${task.name} name`} value={task.name} onChange={(event) => updateTask(task.id, { name: event.target.value })} className="w-48 rounded border border-stone-200 bg-white px-2 py-1" />
                </td>
                <td className="py-4 pr-4 text-stone-600">{task.taskType}</td>
                <td className="py-4 pr-4 text-stone-600">{task.primaryModel}</td>
                <td className="py-4 pr-4 text-stone-600">{task.recommendedExecutionMethod}</td>
                <td className="py-4 pr-4 text-stone-600">{task.estimatedInputTokens.toLocaleString("en-US")} / {task.estimatedOutputTokens.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {expandedTaskId && (() => {
        const task = project.tasks.find((item) => item.id === expandedTaskId);
        if (!task) return null;
        return <div data-testid="routing-editor" className="bw-surface-emphasis mt-6 rounded-2xl border p-5">
          <div className="mb-4 text-sm font-semibold text-stone-900">Routing editor: {task.name}</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs text-stone-600">Task type<select value={task.taskType} onChange={(event) => updateTask(task.id, { taskType: event.target.value })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm"><option>Classification</option><option>Extraction</option><option>Retrieval</option><option>Generation</option><option>Validation</option></select></label>
            <label className="text-xs text-stone-600">Execution method<input value={task.recommendedExecutionMethod} onChange={(event) => updateTask(task.id, { recommendedExecutionMethod: event.target.value })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
            <label className="text-xs text-stone-600">Primary provider<input value={task.primaryProvider} onChange={(event) => updateTask(task.id, { primaryProvider: event.target.value as WorkflowTask["primaryProvider"] })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
            <label className="text-xs text-stone-600">Primary model<select value={task.primaryModel} onChange={(event) => updateTask(task.id, { primaryModel: event.target.value, needsLLM: event.target.value !== "Deterministic retrieval" })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm"><option>Deterministic retrieval</option>{providerModels.map((model) => <option key={model}>{model}</option>)}</select></label>
            <label className="text-xs text-stone-600">Fallback model<select value={task.fallbackModel} onChange={(event) => updateTask(task.id, { fallbackModel: event.target.value })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm"><option>Human review</option>{providerModels.map((model) => <option key={model}>{model}</option>)}</select></label>
            <label className="text-xs text-stone-600">Input/context tokens<input type="number" min="0" value={task.estimatedInputTokens} onChange={(event) => updateTask(task.id, { estimatedInputTokens: Number(event.target.value) })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
            <label className="text-xs text-stone-600">Output tokens<input type="number" min="0" value={task.estimatedOutputTokens} onChange={(event) => updateTask(task.id, { estimatedOutputTokens: Number(event.target.value) })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
            <label className="text-xs text-stone-600">Calls per execution<input type="number" min="0" step="0.1" value={task.expectedCallsPerExecution} onChange={(event) => updateTask(task.id, { expectedCallsPerExecution: Number(event.target.value) })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
            <label className="text-xs text-stone-600">Retry rate<input type="number" min="0" max="1" step="0.01" value={task.expectedRetryRate} onChange={(event) => updateTask(task.id, { expectedRetryRate: Number(event.target.value) })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
            <label className="text-xs text-stone-600">Cache hit rate<input type="number" min="0" max="1" step="0.05" value={task.cacheHitRate} onChange={(event) => updateTask(task.id, { cacheHitRate: Number(event.target.value) })} className="mt-1 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
            <label className="flex items-center gap-2 pt-5 text-sm text-stone-700"><input type="checkbox" checked={task.cacheEligible} onChange={(event) => updateTask(task.id, { cacheEligible: event.target.checked })} /> Cache eligible</label>
          </div>
          <label className="mt-4 block text-xs text-stone-600">Human-review policy<textarea value={task.humanReviewPolicy} onChange={(event) => updateTask(task.id, { humanReviewPolicy: event.target.value })} className="mt-1 min-h-20 w-full rounded border border-stone-300 bg-white p-2 text-sm" /></label>
          <div className="mt-4 text-xs text-stone-600">Every edit recalculates all four scenario policies, their cost traces and exports. Suitability remains a heuristic, not measured model quality.</div>
        </div>;
      })()}
    </div>
  );
}

function ScenariosPanel({ project, selectedScenario, onSelect }: { project: Project; selectedScenario: string; onSelect: (value: string) => void }) {
  const [showCalculation, setShowCalculation] = useState(false);
  const selected = project.scenarios.find((item) => item.id === selectedScenario) ?? project.scenarios[2];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-2">
        {project.scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onSelect(scenario.id)}
            className={selectedScenario === scenario.id ? "rounded-2xl border border-stone-900 bg-white p-5 text-left shadow-sm" : "rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm hover:border-stone-400"}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{scenario.label}</div>
                <div className="mt-2 text-xl font-semibold text-stone-900">{formatMoney(scenario.monthlyCost)}</div>
              </div>
              <div className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">{scenario.confidence}</div>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-600">{scenario.summary}</p>
            <div className="mt-4 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
              <div>Input tokens: {scenario.inputTokens.toLocaleString("en-US")}</div>
              <div>Cached tokens: {scenario.cachedTokens.toLocaleString("en-US")}</div>
              <div>Output tokens: {scenario.outputTokens.toLocaleString("en-US")}</div>
              <div>Model calls: {scenario.modelCalls}</div>
              <div>Latency: {scenario.expectedLatency}</div>
              <div>Save vs baseline: {scenario.savingsVsBaseline.toFixed(1)}%</div>
            </div>
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Scenario detail</div>
        {(() => {
          const scenario = selected;
          if (!scenario) return null;
          return (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="text-xl font-semibold text-stone-900">{scenario.label}</div>
                <p className="mt-3 text-sm leading-6 text-stone-600">{scenario.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-stone-600">
                  {scenario.keyCompromises.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Estimated operating profile</div>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <div className="flex justify-between"><span>Monthly cost</span><strong>{formatMoney(scenario.monthlyCost)}</strong></div>
                  <div className="flex justify-between"><span>Model calls</span><strong>{scenario.modelCalls}</strong></div>
                  <div className="flex justify-between"><span>Premium model share</span><strong>{scenario.premiumModelShare}%</strong></div>
                  <div className="flex justify-between"><span>Deterministic share</span><strong>{scenario.deterministicShare}%</strong></div>
                  {scenario.costTrace && <div className="mt-4 border-t border-stone-200 pt-3 text-xs leading-5 text-stone-600">
                    <div className="font-medium text-stone-900">Cost trace</div>
                    <div>Model: {scenario.costTrace.modelId}</div>
                    <div>Price / 1M tokens: {formatMoney(scenario.costTrace.inputPricePerMillion)} in, {formatMoney(scenario.costTrace.cachedInputPricePerMillion)} cached, {formatMoney(scenario.costTrace.outputPricePerMillion)} out</div>
                    <div>Calls: {scenario.costTrace.callsPerExecution} · retries: {(scenario.costTrace.retryRate * 100).toFixed(1)}% · fallback: {(scenario.costTrace.fallbackRate * 100).toFixed(1)}%</div>
                    <div>Monthly volume: {scenario.costTrace.monthlyExecutions.toLocaleString("en-US")}</div>
                    <button type="button" onClick={() => setShowCalculation(true)} className="mt-3 rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800">View calculation</button>
                  </div>}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Accessible comparison table</div>
        <table className="min-w-full text-left text-sm"><thead><tr className="border-b border-stone-200 text-stone-500"><th className="py-2">Scenario</th><th className="py-2">Monthly cost</th><th className="py-2">Savings</th><th className="py-2">Deterministic</th><th className="py-2">Human review</th></tr></thead><tbody>{project.scenarios.map((item) => <tr key={item.id} className="border-b border-stone-100"><td className="py-2 font-medium">{item.label}</td><td className="py-2">{formatMoney(item.monthlyCost)}</td><td className="py-2">{item.savingsVsBaseline}%</td><td className="py-2">{item.deterministicShare}%</td><td className="py-2">{item.humanReviewRate}%</td></tr>)}</tbody></table>
      </div>
      {showCalculation && selected?.costTrace && <div data-testid="calculation-drawer" className="fixed inset-y-0 right-0 z-20 w-full max-w-xl overflow-y-auto border-l border-stone-300 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Calculation drawer</div><h3 className="mt-2 text-2xl font-semibold">{selected.label}</h3></div><button type="button" onClick={() => setShowCalculation(false)} className="rounded-full border border-stone-300 px-3 py-2 text-sm">Close</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoLine label="Monthly workload" value={`${selected.costTrace.monthlyExecutions.toLocaleString("en-US")} executions`} /><InfoLine label="Cost per execution" value={formatMoney(selected.estimatedCostPerExecution)} /><InfoLine label="Monthly cost" value={formatMoney(selected.monthlyCost)} /><InfoLine label="Pricing source" value={selected.costTrace.pricingStatus === "demo-catalogue" ? "Demo catalogue pricing" : "Pricing unavailable"} /></div>
        <div className="mt-5 space-y-4">{selected.costTrace.tasks?.map((task) => <div key={task.taskId} className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm"><div className="font-semibold text-stone-900">{task.taskName}</div><div className="mt-2 text-xs leading-5 text-stone-600">{task.costFormula}</div><div className="mt-2 grid gap-1 text-xs text-stone-600 sm:grid-cols-2"><span>Instruction: {task.instructionTokens.toLocaleString("en-US")}</span><span>Variable input: {task.variableInputTokens.toLocaleString("en-US")}</span><span>Retrieved context: {task.retrievedContextTokens.toLocaleString("en-US")}</span><span>Output allowance: {task.outputAllowance.toLocaleString("en-US")}</span><span>Expected retry tokens: {task.expectedRetryTokens.toLocaleString("en-US")}</span><span>Expected fallback tokens: {task.expectedFallbackTokens.toLocaleString("en-US")}</span><span>Total expected: {task.totalExpectedTokensPerExecution.toLocaleString("en-US")}</span><span>Calls: {task.calls} · retries: {(task.retryRate * 100).toFixed(1)}%</span><span>Fallback: {(task.fallbackRate * 100).toFixed(1)}%</span><span>Task monthly: {task.monthlyCost === null ? "Unavailable" : formatMoney(task.monthlyCost)}</span></div></div>)}</div>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{selected.costTrace.assumptions?.join(" ")}</div>
      </div>}
    </div>
  );
}

function PromptPanel({ project }: { project: Project }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Prompt comparison</div>
        <h3 className="mt-3 text-2xl font-semibold text-stone-900">Treat prompts as measurable task contracts.</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">The comparison exposes instruction investment, context reduction, output limits and expected retry impact. These are design estimates until a controlled provider result is explicitly recorded.</p>
      </div>
      {project.prompts.map((prompt) => (
        <div key={prompt.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Prompt pack</div>
              <h3 className="mt-2 text-xl font-semibold text-stone-900">{prompt.taskName}</h3>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{prompt.estimatedTokenDifference}</div>
          </div>
          {prompt.taskName.toLowerCase().includes("retrieval") ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
              <div className="font-medium text-stone-900">Retrieval-policy comparison</div>
              <div className="mt-2">Deterministic query construction, metadata filters, top-k ranking, deduplication, and source identifiers. No LLM prompt or generated-token estimate is used for this task.</div>
            </div>
          ) : <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium text-stone-900">Original</div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600">{prompt.originalPrompt}</div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-stone-900">Optimised</div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600">{prompt.optimisedPrompt}</div>
            </div>
          </div>}
          <div className="mt-4 text-sm text-stone-700"><span className="font-medium">Changes:</span> {prompt.changes.join("; ")}</div>
          <div className="mt-4 grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
            <div>Instruction investment: {prompt.tokenDifference && prompt.tokenDifference > 0 ? "+" : ""}{prompt.tokenDifference ?? 0} tokens</div>
            <div>Original expected tokens: {prompt.originalExpectedTokens?.toLocaleString("en-US") ?? "Unavailable"} per request</div>
            <div>Optimised expected tokens: {prompt.optimisedExpectedTokens?.toLocaleString("en-US") ?? "Unavailable"} per request</div>
            <div>{Math.abs(prompt.netTokenDelta ?? 0).toLocaleString("en-US")} {prompt.netTokenDelta && prompt.netTokenDelta < 0 ? "fewer" : "more"} expected tokens per request ({Math.abs(prompt.netTokenDeltaPercent ?? 0).toFixed(1)}%)</div>
            <div>Estimated monthly token impact: {(prompt.estimatedMonthlyTokenImpact ?? 0).toLocaleString("en-US")} tokens</div>
            <div>Context reduction: {prompt.contextReduction && prompt.contextReduction > 0 ? "-" : ""}{prompt.contextReduction ?? 0} tokens</div>
            <div>Output reduction: {prompt.outputReduction && prompt.outputReduction > 0 ? "-" : ""}{prompt.outputReduction ?? 0} tokens</div>
            <div>Expected retry reduction: -{prompt.expectedRetryReduction ?? 0} calls</div>
            <div>Estimation method: {prompt.estimationMethod}</div>
            <div>Validation: {prompt.validationRequired}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TestPanel({ project, lastTest, publicDemo, onRun, onFeedback }: { project: Project; lastTest: ControlledTestRecord | null; publicDemo: boolean; onRun: (taskId: string, mode: "demo" | "mocked-byok" | "live-byok") => void; onFeedback: (feedback: "accepted" | "revise" | "rejected") => void }) {
  const [selectedTaskId, setSelectedTaskId] = useState(project.tasks[0]?.id ?? "");
  const connected = project.providerConfig?.status === "Connected";
  const selectedTask = project.tasks.find((task) => task.id === selectedTaskId) ?? project.tasks[0];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Controlled model test</div>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-stone-600">Run one explicit task to compare the design estimate with a labelled simulation, mock adapter response or provider-reported result. No test starts automatically.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Workflow task</span><select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} className="w-full bg-transparent font-medium text-stone-900">{project.tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}</select></label>
          <InfoLine label="Estimated tokens" value={`${selectedTask.estimatedInputTokens.toLocaleString("en-US")} in / ${selectedTask.estimatedOutputTokens.toLocaleString("en-US")} out`} />
          <InfoLine label="Provider state" value={connected ? "Validated provider available" : "Demo mode only"} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => onRun(selectedTask.id, "demo")} className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:border-stone-500">Run demo test</button>
          {!publicDemo && <button onClick={() => onRun(selectedTask.id, "mocked-byok")} className="rounded-full border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-900 hover:border-amber-500">Run mocked BYOK test</button>}
          {publicDemo ? <><button type="button" disabled className="rounded-full border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-900 disabled:cursor-not-allowed disabled:opacity-70">Live provider test</button><span className="max-w-md text-xs text-stone-500">Available in the server-hosted BuildWise application after configuring a provider. GitHub Pages never sends provider credentials.</span></> : <button onClick={() => onRun(selectedTask.id, "live-byok")} disabled={!connected} className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400">Run live provider test</button>}
        </div>
        <div className="mt-4 text-xs text-stone-500">Every run is explicit. BuildWise never starts a paid call automatically.</div>
      </div>

      {lastTest && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">{lastTest.provenance === "demo-simulation" ? "Simulation vs Design Estimate" : "Provider Result vs Design Estimate"}</div>
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>{lastTest.provenance === "demo-simulation" ? "Simulated demo result" : lastTest.provenance === "mock-adapter" ? "Mock adapter result" : "Provider reported result"}</strong><div className="mt-1">{lastTest.provenance === "demo-simulation" ? "Generated locally using the demo adapter. This validates the product flow, not provider availability or model quality. No paid provider call was made." : lastTest.provenance === "mock-adapter" ? "Contract-shaped mock adapter response. No external provider call was made." : `Provider-reported usage · Measured latency · Calculated cost using ${lastTest.pricingSource ?? "pricing source"}`}</div></div>
          <div className="grid gap-4 md:grid-cols-5">
            <InfoLine label={lastTest.provenance === "live-provider" ? "Provider-reported input" : "Simulated input"} value={`${lastTest.actualInputTokens.toLocaleString("en-US")} tokens`} />
            <InfoLine label={lastTest.provenance === "live-provider" ? "Provider-reported output" : "Simulated output"} value={`${lastTest.actualOutputTokens.toLocaleString("en-US")} tokens`} />
            <InfoLine label={lastTest.provenance === "live-provider" ? "Provider-reported latency" : "Simulated latency"} value={`${lastTest.latencyMs} ms`} />
            <InfoLine label={lastTest.actualCost !== null ? "Estimated test-call cost" : "Call cost unavailable"} value={lastTest.actualCost !== null ? formatCost(lastTest.actualCost) : "Pricing unavailable"} />
            <InfoLine label="Projected monthly cost" value={lastTest.projectedMonthlyCost === null || lastTest.projectedMonthlyCost === undefined ? "Monthly cost unavailable" : formatMoney(lastTest.projectedMonthlyCost)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <InfoLine label="Design estimate input" value={`${lastTest.estimatedInputTokens.toLocaleString("en-US")} tokens`} />
            <InfoLine label="Design estimate output" value={`${lastTest.estimatedOutputTokens.toLocaleString("en-US")} tokens`} />
            <InfoLine label="Finish reason" value={lastTest.finishReason} />
          </div>
          <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"><div className="font-medium text-stone-900">{lastTest.providerName}</div><div className="mt-2">{lastTest.output}</div><div className="mt-2 text-xs text-stone-500">{lastTest.warnings.join(" ") || "No warnings."}</div></div>
          <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-2 text-sm font-medium text-stone-800">Feedback</span><button onClick={() => onFeedback("accepted")} className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Accepted</button><button onClick={() => onFeedback("revise")} className="rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Revise</button><button onClick={() => onFeedback("rejected")} className="rounded-full border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">Rejected</button>{lastTest.feedback && <span className="text-xs text-stone-500">Recorded: {lastTest.feedback}. Accepted samples recalibrate the estimate.</span>}</div>
        </div>
      )}
    </div>
  );
}

function BlueprintPanel({ project, estimate }: { project: Project; estimate: ScenarioMetric | null }) {
  const controls = project.spine.deterministicControls;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Implementation blueprint</div>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoLine label="Recommended route" value={estimate?.label ?? "Balanced"} />
          <InfoLine label="Monthly cost" value={estimate ? formatMoney(estimate.monthlyCost) : "-"} />
          <InfoLine label="Quality sensitivity" value={project.input.qualitySensitivity} />
          <InfoLine label="Initial control set" value={`${controls.length} initial controls`} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => downloadBlueprint(project, estimate)} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white">Export JSON</button>
          <button onClick={() => downloadBlueprintMarkdown(project, estimate)} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Export Markdown</button>
          <button onClick={() => window.print()} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Print / PDF view</button>
          <button onClick={() => navigator.clipboard?.writeText(buildImplementationBrief(project, estimate))} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700">Copy implementation brief</button>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Governance controls</div>
        <ul className="space-y-2 text-sm text-stone-600">
          {controls.map((control) => <li key={control}>• {control}</li>)}
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Business objective", project.input.businessOutcome],
          ["Recommended scenario", estimate?.label ?? "Balanced"],
          ["Token and cost calculation", "Canonical per-task traces with demo catalogue pricing and visible retry/fallback assumptions."],
          ["Known limitations", "Live-provider verification and contractual pricing require explicit user configuration."],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{label}</div><div className="mt-3 text-sm leading-6 text-stone-700">{value}</div></div>)}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{label}</div>
      <div className="mt-3 text-lg font-semibold text-stone-900">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-stone-900">{value}</div>
    </div>
  );
}

function downloadBlueprint(project: Project, estimate: ScenarioMetric | null) {
  const blueprint = {
    exportedAt: new Date().toISOString(),
    project: project.name,
    recommendation: estimate?.label ?? "Balanced",
    monthlyCost: estimate?.monthlyCost ?? null,
    workloadSpine: project.spine,
    workflow: project.tasks,
    scenarios: project.scenarios,
    promptPack: project.prompts,
    testRuns: project.testRuns ?? [],
    calibration: project.calibration ?? { inputMultiplier: 1, outputMultiplier: 1, sampleCount: 0 },
    canonicalCalculation: estimate?.costTrace ?? null,
    pricingProvenance: "Demo catalogue pricing",
  };
  const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-blueprint.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildImplementationBrief(project: Project, estimate: ScenarioMetric | null) {
  return `BuildWise implementation brief\n\nProject: ${project.name}\nObjective: ${project.input.businessOutcome}\nRecommended scenario: ${estimate?.label ?? "Balanced"}\nMonthly cost: ${estimate ? formatMoney(estimate.monthlyCost) : "Unavailable"}\nControls: ${project.spine.deterministicControls.join(", ")}\nPricing: Demo catalogue pricing`;
}

function downloadBlueprintMarkdown(project: Project, estimate: ScenarioMetric | null) {
  const markdown = `# ${project.name}\n\n## Executive summary\n${project.input.businessOutcome}\n\n## Workload assumptions\n- Monthly executions: ${project.input.executionsPerMonth.toLocaleString("en-US")}\n- Budget: ${formatMoney(project.input.monthlyBudget)}\n- Privacy: ${project.spine.privacyLevel}\n- Pricing provenance: Demo catalogue pricing\n\n## Recommended scenario\n${estimate?.label ?? "Balanced"} - ${estimate ? formatMoney(estimate.monthlyCost) : "Monthly cost unavailable"} per month.\n\n## Scenario comparison\n${project.scenarios.map((scenario) => `- ${scenario.label}: ${formatMoney(scenario.monthlyCost)} monthly, ${scenario.savingsVsBaseline}% savings vs baseline`).join("\n")}\n\n## Workflow architecture\n${project.tasks.map((task) => `- ${task.name}: ${task.recommendedExecutionMethod}; ${task.estimatedInputTokens.toLocaleString("en-US")} input / ${task.estimatedOutputTokens.toLocaleString("en-US")} output tokens per task execution.`).join("\n")}\n\n## Governance and known limitations\n${project.spine.deterministicControls.map((control) => `- ${control}`).join("\n")}\n- Live-provider verification and contractual pricing require explicit user configuration.\n`;
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-blueprint.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}
