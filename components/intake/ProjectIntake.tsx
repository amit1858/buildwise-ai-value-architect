"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBlankProjectInput, type IntakeForm, type WorkloadUnit } from "@/lib/buildwise";
import { createBlankProjectState, deleteProjectState, loadProjectState, migrateLegacyBrowserState, saveDraftState } from "@/lib/project-state";
import { createProjectFromInput } from "@/lib/project-store";
import { workspaceHref } from "@/lib/navigation";
import { SiteHeader } from "@/components/SiteHeader";

const stepLabels = ["Business problem", "Workload and volume", "Quality, risk and governance", "Budget and build preference"];

export function ProjectIntake() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get("project");
  const [projectId, setProjectId] = useState(requestedProjectId ?? "");
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<IntakeForm>(getBlankProjectInput);
  const [ready, setReady] = useState(false);
  const [stateError, setStateError] = useState("");

  useEffect(() => {
    migrateLegacyBrowserState();
    const id = requestedProjectId || createBlankProjectState().projectId;
    const loaded = loadProjectState(id);
    queueMicrotask(() => {
      if (loaded.ok) {
        setProjectId(id);
        setForm(loaded.state.intake);
        setStepIndex(loaded.state.intakeStep);
        setReady(true);
      } else {
        setStateError(loaded.message);
        setReady(true);
      }
    });
  }, [requestedProjectId]);

  const currentStep = stepLabels[stepIndex];

  const update = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (projectId) saveDraftState(projectId, next, stepIndex);
  };
  const updateMany = (patch: Partial<IntakeForm>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (projectId) saveDraftState(projectId, next, stepIndex);
  };

  const canContinue = useMemo(() => {
    if (!form.projectName || !form.problemStatement) return false;
    if (stepIndex === 1 && form.executionsPerMonth <= 0) return false;
    return true;
  }, [form, stepIndex]);

  const isLastStep = stepIndex === stepLabels.length - 1;

  const handleNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (stepIndex < stepLabels.length - 1 && canContinue) {
      const next = stepIndex + 1;
      saveDraftState(projectId, form, next);
      setStepIndex(next);
    }
  };

  const handleBack = () => {
    const next = Math.max(0, stepIndex - 1);
    saveDraftState(projectId, form, next);
    setStepIndex(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canContinue) return;
    const project = createProjectFromInput(form, projectId);
    router.push(workspaceHref(project.id, "spine"));
  };

  const handleReset = () => {
    if (!window.confirm("Start over and clear only this project? This cannot be undone.")) return;
    deleteProjectState(projectId);
    const replacement = createBlankProjectState();
    router.replace(`/new?project=${encodeURIComponent(replacement.projectId)}`);
  };

  if (!ready) return <main className="bw-page p-10 text-stone-700">Loading browser-local draft…</main>;
  if (stateError) return <main className="bw-page p-10 text-stone-700"><h1 className="text-2xl font-semibold">Saved project cannot be opened</h1><p className="mt-3">{stateError}</p><button type="button" onClick={() => { const next = createBlankProjectState(); router.replace(`/new?project=${encodeURIComponent(next.projectId)}`); }} className="bw-action-primary mt-5">Start a clean blueprint</button></main>;

  return (
    <div className="bw-page min-h-[100dvh]">
      <SiteHeader compact />
      <main id="main-content" className="bg-stone-100 px-4 py-8 text-stone-900 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 border-b border-stone-300 pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">Enterprise use-case intake</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-stone-900">Describe the use case</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">These visible inputs drive suitability, build-path selection, workload decomposition, scenario economics and every exported artifact.</p>
          </div>
        </header>

        <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">Progress</div>
          <div className="grid gap-3 md:grid-cols-4">
            {stepLabels.map((label, index) => (
              <div key={label} className={index === stepIndex ? "rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-sm font-medium text-white" : index < stepIndex ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800" : "rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600"}>
                {index + 1}. {label}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">Current step</div>
                <div className="mt-2 text-2xl font-semibold text-stone-900">{currentStep}</div>
              </div>
              <div className="flex items-center gap-2"><div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">Browser-local autosave</div><button type="button" onClick={handleReset} className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700">Reset</button></div>
            </div>

            {stepIndex === 0 && (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Project name"><input value={form.projectName} onChange={(e) => update("projectName", e.target.value)} className="field" /></Field>
                  <Field label="Industry"><input value={form.industry} onChange={(e) => update("industry", e.target.value)} className="field" /></Field>
                </div>
                <Field label="Business problem"><textarea rows={5} value={form.problemStatement} onChange={(e) => update("problemStatement", e.target.value)} className="field min-h-[140px]" /></Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Target users"><input value={form.targetUsers} onChange={(e) => update("targetUsers", e.target.value)} className="field" /></Field>
                  <Field label="Desired business outcome"><input value={form.businessOutcome} onChange={(e) => update("businessOutcome", e.target.value)} className="field" /></Field>
                </div>
                <Field label="Current process or baseline"><textarea rows={4} value={form.currentProcess} onChange={(e) => update("currentProcess", e.target.value)} className="field min-h-[110px]" /></Field>
              </>
            )}

            {stepIndex === 1 && (
              <>
                <div className="grid gap-5 md:grid-cols-3">
                  <Field label="Business executions per month"><input type="number" min="1" value={form.executionsPerMonth || ""} onChange={(e) => update("executionsPerMonth", Number(e.target.value || 0))} className="field" /></Field>
                  <Field label="Peak concurrency"><input type="number" min="1" value={form.peakConcurrency || ""} onChange={(e) => update("peakConcurrency", Number(e.target.value || 0))} className="field" /></Field>
                  <Field label="Workload mode">
                    <select value={form.workloadMode} onChange={(e) => update("workloadMode", e.target.value as IntakeForm["workloadMode"])} className="field">
                      <option value="batch">Batch</option>
                      <option value="real-time">Real-time</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <SizeField label="Typical input" value={form.typicalInputValue} unit={form.typicalInputUnit} onValue={(value) => update("typicalInputValue", value)} onUnit={(unit) => update("typicalInputUnit", unit)} />
                  <SizeField label="High-case / P95 input" value={form.highInputValue} unit={form.highInputUnit} onValue={(value) => update("highInputValue", value)} onUnit={(unit) => update("highInputUnit", unit)} />
                  <SizeField label="Typical output" value={form.typicalOutputValue} unit={form.typicalOutputUnit} onValue={(value) => update("typicalOutputValue", value)} onUnit={(unit) => update("typicalOutputUnit", unit)} />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Average attachments per execution"><input type="number" min="0" value={form.attachedDocuments} onChange={(e) => update("attachedDocuments", Number(e.target.value || 0))} className="field" /></Field>
                  <Field label="Average conversation turns"><input type="number" min="0" value={form.averageConversationTurns} onChange={(e) => updateMany({ averageConversationTurns: Number(e.target.value || 0), conversationHistory: Number(e.target.value || 0) > 0 })} className="field" /></Field>
                </div>
                <Field label="Sample input"><textarea rows={4} value={form.sampleInput} onChange={(e) => update("sampleInput", e.target.value)} className="field min-h-[110px]" /></Field>
                <details className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <summary className="cursor-pointer text-sm font-medium">Advanced assumptions</summary>
                  <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <Field label="Average attachment pages or size"><input type="number" min="0" value={form.averageAttachmentPages} onChange={(e) => update("averageAttachmentPages", Number(e.target.value || 0))} className="field" /></Field>
                    <Field label="Retrieved passages per execution"><input type="number" min="0" value={form.retrievedPassages} onChange={(e) => update("retrievedPassages", Number(e.target.value || 0))} className="field" /></Field>
                    <Field label="Average tokens per passage"><input type="number" min="0" value={form.tokensPerPassage} onChange={(e) => update("tokensPerPassage", Number(e.target.value || 0))} className="field" /></Field>
                    <Field label="Reusable / cached context (%)"><input type="number" min="0" max="100" value={form.cachedContextPercent} onChange={(e) => update("cachedContextPercent", Number(e.target.value || 0))} className="field" /></Field>
                    <Field label="Peak-volume multiplier"><input type="number" min="1" step="0.1" value={form.peakVolumeMultiplier} onChange={(e) => update("peakVolumeMultiplier", Number(e.target.value || 1))} className="field" /></Field>
                    <Field label="Target response time (seconds)"><input type="number" min="0" value={form.targetResponseSeconds} onChange={(e) => updateMany({ targetResponseSeconds: Number(e.target.value || 0), latencyTarget: `${e.target.value || 0} seconds` })} className="field" /></Field>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-stone-500">Conversions use transparent planning assumptions: 1 word = 1.33 tokens, 1 page = 500 tokens, and 4 characters = 1 token. Business executions are not model calls; calls are derived from task routing, retries, and fallbacks.</p>
                </details>
              </>
            )}

            {stepIndex === 2 && (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Quality sensitivity"><select value={form.qualitySensitivity} onChange={(e) => update("qualitySensitivity", e.target.value as IntakeForm["qualitySensitivity"])} className="field"><option value="standard">Standard</option><option value="high">High</option><option value="critical">Critical</option></select></Field>
                  <Field label="Data sensitivity"><select value={form.dataSensitivity} onChange={(e) => update("dataSensitivity", e.target.value)} className="field"><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="regulated">Regulated</option></select></Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Latency target"><select value={form.latencyTarget} onChange={(e) => update("latencyTarget", e.target.value)} className="field"><option value="< 3 seconds">Under 3 seconds</option><option value="< 4 seconds">Under 4 seconds</option><option value="< 20 seconds">Under 20 seconds</option><option value="< 30 seconds">Under 30 seconds</option></select></Field>
                  <Field label="Human review required"><select value={form.humanReview ? "yes" : "no"} onChange={(e) => update("humanReview", e.target.value === "yes")} className="field"><option value="yes">Yes</option><option value="no">No</option></select></Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700"><span className="mb-2 block font-medium text-stone-900">Data residency required</span><input type="checkbox" checked={form.dataResidency} onChange={(e) => update("dataResidency", e.target.checked)} /></label>
                  <label className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700"><span className="mb-2 block font-medium text-stone-900">Structured output required</span><input type="checkbox" checked={form.structuredOutput} onChange={(e) => update("structuredOutput", e.target.checked)} /></label>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700"><span className="mb-2 block font-medium text-stone-900">External providers permitted</span><input type="checkbox" checked={form.externalProviders} onChange={(e) => update("externalProviders", e.target.checked)} /></label>
                  <label className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700"><span className="mb-2 block font-medium text-stone-900">Local models allowed</span><input type="checkbox" checked={form.localModels} onChange={(e) => update("localModels", e.target.checked)} /></label>
                </div>
              </>
            )}

            {stepIndex === 3 && (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Current process cost (USD per month)"><input type="number" value={form.processCost || 0} onChange={(e) => update("processCost", Number(e.target.value || 0))} className="field" /></Field>
                  <Field label="Expected value per outcome (USD)"><input type="number" value={form.expectedValue || 0} onChange={(e) => update("expectedValue", Number(e.target.value || 0))} className="field" /></Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Monthly AI budget"><input type="number" value={form.monthlyBudget} onChange={(e) => update("monthlyBudget", Number(e.target.value || 0))} className="field" /></Field>
                  <Field label="Currency"><select value="USD" className="field" onChange={() => undefined}><option value="USD">USD</option></select></Field>
                </div>
                <Field label="Preferred providers"><input value={form.approvedProviders.join(", ")} onChange={(e) => update("approvedProviders", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))} className="field" /></Field>
                <Field label="Build preference">
                  <select value={form.builderPreference} onChange={(e) => update("builderPreference", e.target.value as IntakeForm["builderPreference"])} className="field">
                    <option value="pro-code">Pro-code</option>
                    <option value="low-code">Low-code</option>
                    <option value="architecture">Architecture assessment only</option>
                  </select>
                </Field>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                  <div className="font-medium text-stone-900">Current understanding</div>
                  <div className="mt-2 leading-6">{form.projectName || "Untitled"} - {form.problemStatement || "No problem statement yet."} {form.executionsPerMonth ? `Approx. ${form.executionsPerMonth.toLocaleString("en-US")} monthly executions.` : ""}</div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between">
              <button type="button" onClick={handleBack} disabled={stepIndex === 0} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40">Back</button>
              {!isLastStep ? (
                <button key={`continue-${stepIndex}`} type="button" onClick={handleNext} disabled={!canContinue} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400">Continue</button>
              ) : (
                <button type="submit" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white">Review and analyse</button>
              )}
            </div>
          </div>

          <aside className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">Summary</div>
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div><span className="font-medium text-stone-900">Problem:</span> {form.problemStatement || "Add context"}</div>
                <div><span className="font-medium text-stone-900">Volume:</span> {form.executionsPerMonth ? `${form.executionsPerMonth.toLocaleString("en-US")} / month` : "Not set"}</div>
                <div><span className="font-medium text-stone-900">Quality:</span> {form.qualitySensitivity}</div>
                <div><span className="font-medium text-stone-900">Budget:</span> {form.monthlyBudget ? `$${form.monthlyBudget.toLocaleString("en-US")}` : "Not set"}</div>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
              <div className="font-medium text-stone-900">Helper text</div>
              <ul className="mt-3 space-y-2 leading-6">
                <li>• “Current process cost” is measured as monthly operating cost before AI automation.</li>
                <li>• “Expected value per outcome” means the measured business value gained when a workflow completes successfully.</li>
                <li>• Input and output sizes should reflect the data that enters and leaves the model at each step.</li>
              </ul>
            </div>
          </aside>
        </form>
      </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-stone-700">
      <span className="mb-2 block font-medium text-stone-800">{label}</span>
      {children}
    </label>
  );
}

function SizeField({ label, value, unit, onValue, onUnit }: { label: string; value: number; unit: WorkloadUnit; onValue: (value: number) => void; onUnit: (unit: WorkloadUnit) => void }) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input aria-label={`${label} value`} type="number" min="0" value={value || ""} onChange={(event) => onValue(Number(event.target.value || 0))} className="field" />
        <select aria-label={`${label} unit`} value={unit} onChange={(event) => onUnit(event.target.value as WorkloadUnit)} className="field">
          <option value="tokens">tokens</option><option value="words">words</option><option value="pages">pages</option><option value="characters">characters</option>
        </select>
      </div>
    </Field>
  );
}
