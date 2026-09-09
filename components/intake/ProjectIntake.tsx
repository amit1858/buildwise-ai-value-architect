"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDefaultProjectInput, type IntakeForm } from "@/lib/buildwise";
import { createProjectFromInput } from "@/lib/project-store";

const STORAGE_KEY = "buildwise-intake-draft";
const stepLabels = ["Business problem", "Workload and volume", "Quality, risk and governance", "Budget and build preference"];

const EMPTY_FORM: IntakeForm = getDefaultProjectInput();

export function ProjectIntake() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<IntakeForm>(() => {
    if (typeof window === "undefined") return EMPTY_FORM;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? { ...EMPTY_FORM, ...JSON.parse(raw) } : EMPTY_FORM;
    } catch {
      return EMPTY_FORM;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }
  }, [form]);

  const currentStep = stepLabels[stepIndex];

  const update = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const canContinue = useMemo(() => {
    if (!form.projectName || !form.problemStatement) return false;
    if (stepIndex === 1 && form.executionsPerMonth <= 0) return false;
    return true;
  }, [form, stepIndex]);

  const isLastStep = stepIndex === stepLabels.length - 1;

  const handleNext = () => {
    if (stepIndex < stepLabels.length - 1 && canContinue) {
      setStepIndex((current) => current + 1);
    }
  };

  const handleBack = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canContinue) return;
    const project = createProjectFromInput(form);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    router.push(`/workspace/${project.id}/spine`);
  };

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between border-b border-stone-300 pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">BuildWise</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-stone-900">Describe the use case</h1>
          </div>
          <Link href="/" className="text-sm text-stone-700 underline-offset-2 hover:underline">Back to home</Link>
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
              <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">Autosave on</div>
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
                  <Field label="Monthly execution volume"><input type="number" value={form.executionsPerMonth} onChange={(e) => update("executionsPerMonth", Number(e.target.value || 1))} className="field" /></Field>
                  <Field label="Peak concurrency"><input type="number" value={form.peakConcurrency} onChange={(e) => update("peakConcurrency", Number(e.target.value || 1))} className="field" /></Field>
                  <Field label="Workload mode">
                    <select value={form.workloadMode} onChange={(e) => update("workloadMode", e.target.value as IntakeForm["workloadMode"])} className="field">
                      <option value="batch">Batch</option>
                      <option value="real-time">Real-time</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Typical input size (selectable units)"><input value={form.typicalInputSize} onChange={(e) => update("typicalInputSize", e.target.value)} className="field" /></Field>
                  <Field label="Typical output size (selectable units)"><input value={form.typicalOutputSize} onChange={(e) => update("typicalOutputSize", e.target.value)} className="field" /></Field>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Attached documents"><input type="number" value={form.attachedDocuments} onChange={(e) => update("attachedDocuments", Number(e.target.value || 0))} className="field" /></Field>
                  <Field label="Conversation history"><select value={form.conversationHistory ? "yes" : "no"} onChange={(e) => update("conversationHistory", e.target.value === "yes")} className="field"><option value="yes">Yes</option><option value="no">No</option></select></Field>
                </div>
                <Field label="Sample input"><textarea rows={4} value={form.sampleInput} onChange={(e) => update("sampleInput", e.target.value)} className="field min-h-[110px]" /></Field>
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
                  <div className="mt-2 leading-6">{form.projectName || "Untitled"} — {form.problemStatement || "No problem statement yet."} {form.executionsPerMonth ? `Approx. ${form.executionsPerMonth.toLocaleString("en-US")} monthly executions.` : ""}</div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between">
              <button type="button" onClick={handleBack} disabled={stepIndex === 0} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40">Back</button>
              {!isLastStep ? (
                <button type="button" onClick={handleNext} disabled={!canContinue} className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400">Continue</button>
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
