"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { GenerateResponse, ModuleOutput, ExecutionItem } from "@/lib/types";

export default function ResultsPage() {
  const [result] = useState<GenerateResponse | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem("buildwise_result");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GenerateResponse;
    } catch {
      return null;
    }
  });
  const [modules, setModules] = useState<Record<string, ModuleOutput>>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.sessionStorage.getItem("buildwise_result");
    if (!raw) return {};
    try {
      return (JSON.parse(raw) as GenerateResponse).modules ?? {};
    } catch {
      return {};
    }
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = useCallback(
    async (moduleName: string) => {
      if (!result) return;
      setRegenerating((prev) => ({ ...prev, [moduleName]: true }));
      try {
        const res = await fetch("/api/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleName,
            feedback: feedback[moduleName] ?? "",
            input: result.input,
            decisionSpine: result.decisionSpine,
          }),
        });
        if (res.ok) {
          const data: ModuleOutput = await res.json();
          setModules((prev) => ({ ...prev, [moduleName]: data }));
          setFeedback((prev) => ({ ...prev, [moduleName]: "" }));
          setError(null);
        } else {
          setError("Module regeneration failed. Keep the current result or revise the feedback.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Module regeneration failed. Keep the current result or revise the feedback.");
      } finally {
        setRegenerating((prev) => ({ ...prev, [moduleName]: false }));
      }
    },
    [result, feedback]
  );

  function toggleCollapse(name: string) {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function handleExport() {
    if (!result) return;
    const lines: string[] = [];

    lines.push("BUILDWISE PLAN");
    lines.push("=".repeat(50));

    lines.push("\nINPUT");
    lines.push(`Problem: ${result.input.problem}`);
    if (result.input.goal) lines.push(`Goal: ${result.input.goal}`);
    if (result.input.constraints) lines.push(`Constraints: ${result.input.constraints}`);
    lines.push(`Builder Type: ${result.input.builderType}`);

    lines.push("\nDECISION SPINE");
    const spine = result.decisionSpine;
    lines.push(`Product Type: ${spine.productType}`);
    lines.push(`Complexity: ${spine.complexity}`);
    lines.push(`MVP Wedge: ${spine.mvpWedge}`);
    lines.push(`Persona: ${spine.personaType}`);
    lines.push(`Builder Type: ${spine.builderType}`);
    lines.push(`Constraints: ${spine.constraints.join(", ")}`);
    lines.push(`Recommended Modules: ${spine.recommendedModules.join(", ")}`);

    lines.push("\nMODULES");
    Object.entries(modules).forEach(([name, mod]) => {
      lines.push(`\n--- ${name} ---`);
      if (mod.error) {
        lines.push(`ERROR: ${mod.error}`);
      } else {
        lines.push(mod.title);
        lines.push(`Summary: ${mod.summary}`);
        lines.push(`Key Decision: ${mod.keyDecision}`);
        lines.push(`Reasoning: ${mod.reasoning}`);
        if (mod.tradeoffs.length)
          lines.push(`Tradeoffs:\n${mod.tradeoffs.map((t) => `  - ${t}`).join("\n")}`);
        if (mod.risks.length)
          lines.push(`Risks:\n${mod.risks.map((r) => `  - ${r}`).join("\n")}`);
        if (mod.nextSteps.length)
          lines.push(`Next Steps:\n${mod.nextSteps.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`);
      }
    });

    if (result.executionStrategy) {
      const es = result.executionStrategy;
      lines.push("\nEXECUTION STRATEGY");
      lines.push(`Mode: ${es.executionMode}`);
      lines.push(`Summary: ${es.summary}`);
      es.outputs.forEach((item) => {
        lines.push(`\n${item.label}`);
        if (typeof item.content === "string") {
          lines.push(item.content);
        } else {
          item.content.forEach((c) => lines.push(`  - ${c}`));
        }
      });
      lines.push("\nNext Steps:");
      es.nextSteps.forEach((step, i) => lines.push(`  ${i + 1}. ${step}`));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildwise-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!result) {
    return (
      <main id="main-content" className="bw-page min-h-[100dvh] bg-stone-100 flex flex-col items-center justify-center px-6">
        <span className="bw-text-muted mb-5 select-none text-4xl" aria-hidden="true">B</span>
        <p className="bw-text-secondary mb-5 text-sm">No plan found.</p>
        <Link
          href="/"
          className="bw-text-accent text-sm font-semibold underline underline-offset-4 transition-colors"
        >
          ← Start a new plan
        </Link>
      </main>
    );
  }

  const { decisionSpine, input, executionStrategy, metadata } = result;
  const moduleEntries = Object.entries(modules);
  const failedModules = moduleEntries.filter(([, m]) => m.error).length;

  return (
    <div className="bw-page bw-results min-h-screen bg-[#FEF9ED]">

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[#E1DBC6] bg-[#FEF9ED]/95 backdrop-blur-sm px-8 py-[18px]">
        <div className="max-w-[1140px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[#E5B85C] text-sm leading-none select-none">✦</span>
            <span className="text-[11px] font-bold text-[#5F4E41] uppercase tracking-[0.22em]">
              BuildWise
            </span>
          </div>
          <div className="flex items-center gap-4">
            {metadata && (
              <span className="text-[11px] text-[#B8A090]">
                {metadata.modulesGenerated} modules · {metadata.mode} mode
              </span>
            )}
            <button
              onClick={handleExport}
              className="text-[13px] font-semibold text-[#5F4E41] hover:text-[#3B230E] transition-colors"
            >
              ↓ Export
            </button>
            <Link
              href="/"
              className="text-[13px] font-semibold text-[#5F4E41] hover:text-[#3B230E] transition-colors"
            >
              ← New Plan
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-[1140px] mx-auto px-8 py-14">

        {/* Page title */}
        <div className="mb-3">
          <p className="text-[11px] font-bold text-[#C4A86A] uppercase tracking-[0.22em] mb-3">
            Plan Generated
          </p>
          <h1 className="text-[2.25rem] font-bold tracking-[-0.02em] text-[#3B230E] leading-tight">
            Your Build Plan
          </h1>
          <p className="text-[#5F4E41] text-sm mt-2">
            Based on your input — here is what BuildWise recommends you build first.
          </p>
        </div>

        {/* Partial failure banner */}
        {failedModules > 0 && (
          <div className="mt-5 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 flex items-center gap-3">
            <span className="text-amber-600 text-sm font-bold">⚠</span>
            <p className="text-sm text-amber-800">
              {failedModules} module{failedModules > 1 ? "s" : ""} could not be generated and{" "}
              {failedModules > 1 ? "are" : "is"} shown with an error state below. All other output is intact.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Input context strip */}
        {input?.problem && (
          <div className="mt-6 mb-10 rounded-xl border border-[#E8D9C4] bg-white px-5 py-4 flex items-start gap-4">
            <span className="text-[#E5B85C] text-sm mt-0.5 shrink-0 select-none">✦</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#8A7060] uppercase tracking-wider mb-1">
                Original Input
              </p>
              <p className="text-sm text-[#3B230E] leading-relaxed">{input.problem}</p>
              {input.goal && (
                <p className="text-xs text-[#8A7060] mt-1.5">
                  Goal: {input.goal}
                  {input.constraints ? ` · Constraints: ${input.constraints}` : ""}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-7">

          {/* ── Decision Spine ── */}
          <Card>
            <CardHeader
              label="Decision Spine"
              description="Rule-based classification from your inputs — source of truth for all modules and execution strategy."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
              <SpineField label="Product Type" value={decisionSpine.productType} />
              <SpineField label="Complexity"   value={decisionSpine.complexity} />
              <SpineField label="MVP Wedge"    value={decisionSpine.mvpWedge} />
              <SpineField label="Persona"      value={decisionSpine.personaType} />
              <SpineField label="Builder Type" value={decisionSpine.builderType} accent />
            </div>
            <div className="h-px bg-[#E8D9C4] mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <PillGroupLabel>Constraints</PillGroupLabel>
                <PillList>
                  {decisionSpine.constraints.map((c) => (
                    <Pill key={c}>{c}</Pill>
                  ))}
                </PillList>
              </div>
              <div>
                <PillGroupLabel>Recommended Modules</PillGroupLabel>
                <PillList>
                  {decisionSpine.recommendedModules.map((m) => (
                    <Pill key={m} accent>{m}</Pill>
                  ))}
                </PillList>
              </div>
            </div>
          </Card>

          {/* ── Module Outputs ── */}
          {moduleEntries.length > 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[11px] font-bold text-[#C4A86A] uppercase tracking-[0.22em] mb-1">
                  Modules
                </p>
                <h2 className="text-[1.375rem] font-bold text-[#3B230E]">Structured Output</h2>
                <p className="text-sm text-[#5F4E41] mt-1">
                  Each module ran against the decision spine to produce actionable guidance.
                </p>
              </div>
              {moduleEntries.map(([name, mod]) => (
                <ModuleCard
                  key={name}
                  name={name}
                  mod={mod}
                  isCollapsed={!!collapsed[name]}
                  onToggle={() => toggleCollapse(name)}
                  isRegenerating={!!regenerating[name]}
                  feedbackValue={feedback[name] ?? ""}
                  onFeedbackChange={(v) =>
                    setFeedback((prev) => ({ ...prev, [name]: v }))
                  }
                  onRegenerate={() => handleRegenerate(name)}
                />
              ))}
            </div>
          )}

          {/* ── Execution Strategy ── */}
          {executionStrategy ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#C4A86A] uppercase tracking-[0.22em] mb-1">
                    Execution Strategy
                  </p>
                  <h2 className="text-[1.375rem] font-bold text-[#3B230E]">
                    {executionStrategy.executionMode}
                  </h2>
                  <p className="text-sm text-[#5F4E41] mt-1 max-w-2xl">
                    {executionStrategy.summary}
                  </p>
                </div>
                <span className="ml-4 shrink-0 mt-1 rounded-full bg-[#3B230E] px-3.5 py-1.5 text-[11px] font-bold text-[#E5B85C] capitalize tracking-wide">
                  {executionStrategy.builderType}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {executionStrategy.outputs.map((item, i) => (
                  <ExecutionItemCard key={i} item={item} />
                ))}
              </div>

              <div className="rounded-2xl bg-[#3B230E] px-9 py-7">
                <p className="text-[10px] font-bold text-[#E5B85C] uppercase tracking-wider mb-4">
                  Start Here — Next Steps
                </p>
                <ol className="flex flex-col gap-2.5">
                  {executionStrategy.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#E5B85C]/20 border border-[#E5B85C]/30 flex items-center justify-center text-[10px] font-bold text-[#E5B85C]">
                        {i + 1}
                      </span>
                      <span className="text-sm text-[#F5EDDA] leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E1DBC6] bg-white px-9 py-8 text-center">
              <p className="text-sm text-[#8A7060]">
                Execution strategy could not be generated. Decision spine and module outputs above are still valid.
              </p>
            </div>
          )}

          {/* Metadata footer */}
          {metadata && (
            <div className="pt-2 pb-4 flex items-center justify-between border-t border-[#E8D9C4]">
              <p className="text-[11px] text-[#C4AE98]">
                Generated {new Date(metadata.generatedAt).toLocaleTimeString()} ·{" "}
                v{metadata.version} · {metadata.mode} mode · {metadata.modulesGenerated} modules
              </p>
              <Link
                href="/"
                className="text-[11px] font-semibold text-[#8A7060] hover:text-[#3B230E] underline underline-offset-2 transition-colors"
              >
                Start new plan
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

/* ── Execution Item Card ─────────────────────────────────────── */

function ExecutionItemCard({ item }: { item: ExecutionItem }) {
  const isPrompt = item.type === "prompt";
  const isCode = item.type === "code";

  return (
    <div
      className={`rounded-2xl border ${
        isPrompt ? "border-[#3B230E] bg-[#3B230E]" : "border-[#E1DBC6] bg-white"
      } shadow-[0_2px_20px_rgba(59,35,14,0.05)]`}
    >
      <div
        className={`px-7 py-4 border-b ${
          isPrompt ? "border-white/10" : "border-[#E8D9C4]"
        } flex items-center justify-between`}
      >
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
            isPrompt ? "text-[#E5B85C]" : "text-[#8A7060]"
          }`}
        >
          {item.label}
        </p>
        <div className="flex items-center gap-3">
          {isPrompt && (
            <>
              <span className="text-[10px] font-bold text-[#E5B85C] uppercase tracking-wider">
                Paste into builder
              </span>
              <CopyButton
                text={item.content as string}
                className="text-[#E5B85C] hover:text-white"
              />
            </>
          )}
          {isCode && (
            <>
              <span className="text-[10px] font-bold text-[#8A7060] uppercase tracking-wider">
                File structure
              </span>
              <CopyButton
                text={item.content as string}
                className="text-[#8A7060] hover:text-[#3B230E]"
              />
            </>
          )}
        </div>
      </div>

      <div className="px-7 py-5">
        {item.type === "text" && (
          <p className="text-sm text-[#3B230E] leading-relaxed">{item.content as string}</p>
        )}
        {item.type === "list" && (
          <ul className="flex flex-col gap-2">
            {(item.content as string[]).map((line, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#3B230E] leading-snug">
                <span className="mt-[3px] shrink-0 text-[#E5B85C] text-[10px] font-bold">›</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
        {item.type === "prompt" && (
          <pre className="text-sm text-[#F5EDDA] leading-relaxed whitespace-pre-wrap font-mono">
            {item.content as string}
          </pre>
        )}
        {item.type === "code" && (
          <pre
            tabIndex={0}
            aria-label={`${item.label} code`}
            className="text-[13px] text-[#3B230E] leading-relaxed whitespace-pre font-mono bg-[#FEF9ED] rounded-xl p-4 overflow-x-auto border border-[#E8D9C4]"
          >
            {item.content as string}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ── Module Card ──────────────────────────────────────────────── */

function ModuleCard({
  name,
  mod,
  isCollapsed,
  onToggle,
  isRegenerating,
  feedbackValue,
  onFeedbackChange,
  onRegenerate,
}: {
  name: string;
  mod: ModuleOutput;
  isCollapsed: boolean;
  onToggle: () => void;
  isRegenerating: boolean;
  feedbackValue: string;
  onFeedbackChange: (v: string) => void;
  onRegenerate: () => void;
}) {
  if (mod.error) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-9 py-7">
        <div className="flex items-start gap-4 mb-5">
          <span className="text-red-400 text-lg mt-0.5 shrink-0">⚠</span>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-bold text-red-700">{name}</h3>
              <span className="rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Error
              </span>
            </div>
            <p className="text-sm text-red-600 leading-relaxed">{mod.error}</p>
          </div>
        </div>
        <RegenerateSection
          feedbackValue={feedbackValue}
          onFeedbackChange={onFeedbackChange}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
          placeholder="Describe what to fix or change..."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-[#E1DBC6] shadow-[0_2px_20px_rgba(59,35,14,0.05)]">
      {/* Header — always visible */}
      <div className="px-9 py-5 flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-[1.0625rem] font-bold text-[#3B230E]">{mod.title}</h3>
            <span className="shrink-0 rounded-full bg-[#E5B85C]/15 border border-[#E5B85C]/35 px-3 py-1 text-[10px] font-bold text-[#705B31] uppercase tracking-wider">
              {name}
            </span>
          </div>
          {isCollapsed && (
            <p className="text-xs text-[#8A7060] mt-1.5 leading-relaxed max-w-2xl line-clamp-1">
              {mod.summary}
            </p>
          )}
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 w-8 h-8 rounded-lg border border-[#E8D9C4] bg-[#FEF9ED] flex items-center justify-center text-[#8A7060] hover:border-[#C4A86A] hover:text-[#3B230E] transition-all"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <span
            className="text-[10px] transition-transform duration-200 inline-block"
            style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}
          >
            v
          </span>
        </button>
      </div>

      {/* Body — hidden when collapsed */}
      {!isCollapsed && (
        <div className="px-9 pb-8">
          <div className="border-t border-[#E8D9C4] pt-5 mb-5">
            <p className="text-xs text-[#8A7060] leading-relaxed max-w-2xl">{mod.summary}</p>
          </div>

          <div className="mb-5 rounded-xl bg-[#3B230E] px-5 py-4">
            <p className="text-[10px] font-bold text-[#E5B85C] uppercase tracking-wider mb-1.5">
              Key Decision
            </p>
            <p className="text-sm text-white leading-relaxed">{mod.keyDecision}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <ModuleSection label="Reasoning" content={mod.reasoning} />
            <ModuleListSection label="Tradeoffs" items={mod.tradeoffs} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
            <ModuleListSection label="Risks" items={mod.risks} />
            <ModuleListSection label="Next Steps" items={mod.nextSteps} numbered />
          </div>

          <div className="border-t border-[#E8D9C4] pt-5">
            <p className="text-[10px] font-bold text-[#8A7060] uppercase tracking-wider mb-2.5">
              Regenerate with Intent
            </p>
            <RegenerateSection
              feedbackValue={feedbackValue}
              onFeedbackChange={onFeedbackChange}
              onRegenerate={onRegenerate}
              isRegenerating={isRegenerating}
              placeholder="e.g. 'focus on B2B SaaS' · 'add security constraints' · 'assume 3-person team'..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Regenerate Section ───────────────────────────────────────── */

function RegenerateSection({
  feedbackValue,
  onFeedbackChange,
  onRegenerate,
  isRegenerating,
  placeholder,
}: {
  feedbackValue: string;
  onFeedbackChange: (v: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={feedbackValue}
        onChange={(e) => onFeedbackChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isRegenerating) onRegenerate();
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl bg-[#FEF9ED] border border-[#E8D9C4] px-4 py-2.5 text-sm text-[#3B230E] placeholder-[#C4AE98] focus:outline-none focus:border-[#E5B85C] focus:ring-2 focus:ring-[#E5B85C]/20 transition-colors"
      />
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="w-full shrink-0 rounded-xl bg-[#3B230E] px-4 py-2.5 text-[12px] font-bold text-[#E5B85C] hover:bg-[#705B31] disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto"
      >
        {isRegenerating ? "···" : "↺ Regenerate"}
      </button>
    </div>
  );
}

/* ── Module sub-sections ──────────────────────────────────────── */

function ModuleSection({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-xl bg-[#FEF9ED] border border-[#E8D9C4] px-4 py-4">
      <p className="text-[10px] font-bold text-[#8A7060] uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm text-[#3B230E] leading-relaxed">{content}</p>
    </div>
  );
}

function ModuleListSection({
  label,
  items,
  numbered = false,
}: {
  label: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#FEF9ED] border border-[#E8D9C4] px-4 py-4">
      <p className="text-[10px] font-bold text-[#8A7060] uppercase tracking-wider mb-2">{label}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#3B230E] leading-snug">
            <span className="bw-text-accent mt-[3px] shrink-0 text-[10px] font-bold">
              {numbered ? `${i + 1}.` : "›"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Shared primitives ────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E1DBC6] px-9 py-8 shadow-[0_2px_20px_rgba(59,35,14,0.05)]">
      {children}
    </div>
  );
}

function CardHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-7 pb-5 border-b border-[#E8D9C4]">
      <h2 className="text-[1.0625rem] font-bold text-[#3B230E]">{label}</h2>
      <p className="text-xs text-[#8A7060] mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function SpineField({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#FEF9ED] border border-[#E8D9C4] px-4 py-3.5">
      <p className="text-[10px] font-bold text-[#8A7060] uppercase tracking-wider mb-1.5">{label}</p>
      <p
        className={`text-sm font-bold capitalize leading-snug ${
          accent ? "text-[#705B31]" : "text-[#3B230E]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PillGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[#8A7060] uppercase tracking-wider mb-2.5">
      {children}
    </p>
  );
}

function PillList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-wrap gap-2">{children}</ul>;
}

function Pill({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <li
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium leading-none ${
        accent
          ? "bg-[#E5B85C]/15 border border-[#E5B85C]/35 text-[#705B31]"
          : "bg-[#EFE2D1] text-[#5F4E41]"
      }`}
    >
      {children}
    </li>
  );
}

/* ── Copy Button ──────────────────────────────────────────────── */

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${className}`}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
