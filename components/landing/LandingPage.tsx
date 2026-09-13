"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildDemoProject, exampleUseCases, formatMoney, type IntakeForm } from "@/lib/buildwise";
import { createProjectFromInput, ensureSeedProject } from "@/lib/project-store";

export function LandingPage() {
  const router = useRouter();
  const demoProject = buildDemoProject();
  const baseline = demoProject.scenarios.find((scenario) => scenario.id === "baseline");
  const balanced = demoProject.scenarios.find((scenario) => scenario.id === "balanced");
  const deterministicTasks = demoProject.tasks.filter((task) => !task.needsLLM).length;
  const reviewTasks = demoProject.tasks.filter((task) => task.humanReviewPolicy !== "Never").length;

  const loadExample = (input: IntakeForm) => {
    const project = createProjectFromInput(input);
    router.push(`/workspace/${project.id}/spine`);
  };

  const openExisting = () => {
    const project = ensureSeedProject();
    router.push(`/workspace/${project.id}/spine`);
  };

  return (
    <main id="main-content" className="bw-page min-h-[100dvh] bg-stone-100 text-stone-900">
      <div className="mx-auto max-w-[1360px] px-4 py-5 sm:px-6 lg:px-10">
        <header className="landing-reveal flex min-h-16 items-center justify-between gap-4 border-b border-stone-300/80 pb-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="BuildWise home">
            <div className="grid h-8 w-8 place-items-center rounded-[8px] border border-amber-700/30 bg-amber-100 text-xs font-semibold text-amber-950 transition group-hover:border-amber-800">
              B
            </div>
            <div>
              <div className="text-sm font-semibold text-stone-900">BuildWise</div>
              <div className="text-xs text-stone-600">AI Value Architect</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-stone-700 md:flex" aria-label="Primary">
            <Link href="/methodology" className="font-medium hover:text-stone-900">Methodology</Link>
            <Link href="/settings/providers" className="font-medium hover:text-stone-900">BYOK providers</Link>
            <button onClick={openExisting} className="rounded-[8px] border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-800 hover:border-amber-700">
              Open workspace
            </button>
          </nav>
        </header>

        <section className="grid min-h-[calc(100dvh-6rem)] gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center lg:py-14">
          <div className="landing-reveal" style={{ "--reveal-delay": "80ms" } as CSSProperties}>
            <p className="bw-text-accent mb-4 max-w-[62ch] text-[11px] font-semibold uppercase tracking-[0.22em]">
              Enterprise AI planning
            </p>
            <h1 className="max-w-[11ch] text-balance text-5xl font-semibold leading-[0.94] tracking-[-0.075em] text-stone-900 sm:text-6xl lg:text-7xl">
              Design AI systems that can be defended.
            </h1>
            <p className="mt-6 max-w-[58ch] text-pretty text-lg leading-8 text-stone-700">
              Classify tasks, route models, forecast cost, and export a Build Kit finance and engineering can inspect.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/new" className="bw-action-primary rounded-[8px] px-5 py-3 text-center text-sm font-semibold">
                Start blank
              </Link>
              <button onClick={() => router.push("/workspace/demo-support-project/build-kit")} className="bw-action-secondary rounded-[8px] border px-5 py-3 text-sm font-semibold">
                Inspect demo
              </button>
            </div>
          </div>

          <div className="landing-reveal relative grid gap-4 lg:grid-cols-[0.72fr_1fr]" style={{ "--reveal-delay": "160ms" } as CSSProperties}>
            <div className="space-y-4 lg:pt-14">
              <MetricTile label="Monthly volume" value="100,000" detail="support interactions" />
              <MetricTile label="Deterministic tasks" value={`${deterministicTasks}/${demoProject.tasks.length}`} detail="kept out of LLM billing" />
            </div>
            <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-stone-900">Customer-support optimisation</div>
                  <p className="mt-2 max-w-[46ch] text-sm leading-6 text-stone-600">
                    A live demo project showing routing, budget policy, prompt contracts, and review gates.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Demo</span>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  ["Intake", "Problem, users, volume, quality, and budget"],
                  ["Decision spine", "Workload category, risk, and deterministic controls"],
                  ["Routing", "Task-level execution method and model fallback"],
                  ["Build Kit", "Exportable implementation artifacts"],
                ].map(([label, detail], index) => (
                  <div key={label} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-t border-stone-200 pt-3 first:border-t-0 first:pt-0">
                    <div className="bw-text-accent font-mono text-sm tabular-nums">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="text-sm font-semibold text-stone-900">{label}</div>
                      <div className="mt-1 text-sm leading-6 text-stone-600">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <CostTile label="Naive baseline" value={baseline?.monthlyCost === 0 ? "Unavailable" : formatMoney(baseline?.monthlyCost ?? 0)} />
                <CostTile label="Balanced route" value={balanced?.monthlyCost === 0 ? "Unavailable" : formatMoney(balanced?.monthlyCost ?? 0)} accent />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-reveal grid gap-5 border-y border-stone-300/80 py-12 lg:grid-cols-[1fr_1.35fr]" style={{ "--reveal-delay": "220ms" } as CSSProperties}>
          <div>
            <h2 className="max-w-[13ch] text-balance text-3xl font-semibold leading-tight tracking-[-0.055em] text-stone-900 md:text-4xl">
              The model is not the starting point.
            </h2>
            <p className="mt-5 max-w-[52ch] text-sm leading-7 text-stone-600">
              Token maxxing is a system-design problem, not a billing surprise. Reactive usage caps arrive after architecture, routing, and prompt choices have already set the cost curve. BuildWise moves cost management into the design itself.
            </p>
            <p className="mt-4 max-w-[52ch] text-sm leading-7 text-stone-600">
              It connects problem complexity to task decomposition, model selection, prompt design, token use, governance, and ROI, then carries the decision trail from the initial idea into an implementation-ready Build Kit.
            </p>
            <p className="bw-text-accent mt-4 max-w-[52ch] text-sm font-semibold leading-6">
              Token optimization expands the Low-code, Pro-code, and Hybrid journey rather than replacing it.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <Principle title="Deterministic first" copy="Rules, retrieval, and schema checks sit before generation so routine work avoids model spend." />
            <Principle title="Task-level routing" copy="Every task carries a provider, model, fallback, retry assumption, and human-review gate." />
            <Principle title="Context budget" copy="Token estimates show instruction, retrieved context, variable input, output allowance, retries, and fallback." />
            <Principle title="Implementation handoff" copy="The Build Kit exports prompts, routing, policies, evaluation plans, and low-code or pro-code guidance." />
          </div>
        </section>

        <section className="landing-reveal py-12" style={{ "--reveal-delay": "280ms" } as CSSProperties}>
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
              <h2 className="max-w-[18ch] text-balance text-3xl font-semibold tracking-[-0.055em] text-stone-900">
                One operating blueprint, three delivery paths.
              </h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {demoProject.buildPaths?.map((path) => (
                  <article key={path.id} className={path.id === demoProject.recommendedBuildPath ? "bw-surface-selected rounded-xl border p-4" : "rounded-xl border border-stone-200 bg-stone-50 p-4"}>
                    <div className="bw-text-primary text-base font-semibold">{path.label}</div>
                    <div className="bw-text-accent mt-2 font-mono text-2xl font-semibold tabular-nums">{path.fitScore}%</div>
                    <p className="bw-text-secondary mt-3 text-sm leading-6">{path.summary}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="bw-surface-inverse rounded-2xl border p-6 shadow-sm">
              <div className="text-sm font-semibold text-amber-200">Governance posture</div>
              <p className="mt-4 text-pretty text-2xl font-semibold leading-tight tracking-[-0.045em]">
                {reviewTasks} review gates remain visible before any consequential answer is accepted.
              </p>
              <div className="bw-text-muted mt-6 space-y-3 text-sm leading-6">
                <div>Provider credentials stay out of public-demo exports.</div>
                <div>Provider-reported usage is separated from simulated demo evidence.</div>
                <div>Fallback policy is explicit before production rollout.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-reveal pb-14" style={{ "--reveal-delay": "340ms" } as CSSProperties}>
          <div className="mb-6 max-w-[64ch]">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.055em] text-stone-900">
              Start from a grounded scenario.
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Each sample creates a project with workflow decomposition, scenario economics, prompts, and Build Kit exports.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_1fr]">
            {exampleUseCases.map((example, index) => (
              <button
                key={example.projectName}
                onClick={() => loadExample(example as IntakeForm)}
                className={`rounded-2xl border border-stone-300 bg-white p-5 text-left shadow-sm hover:border-amber-700 ${index === 1 ? "lg:mt-10" : ""}`}
              >
                <div className="text-base font-semibold text-stone-900">{example.projectName}</div>
                <p className="mt-3 text-sm leading-6 text-stone-600">{example.problemStatement}</p>
                <div className="bw-text-accent mt-5 text-sm font-semibold">Open scenario</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-stone-600">{label}</div>
      <div className="mt-3 font-mono text-3xl font-semibold tabular-nums text-stone-900">{value}</div>
      <div className="mt-1 text-sm text-stone-600">{detail}</div>
    </div>
  );
}

function CostTile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={accent ? "bw-surface-selected rounded-xl border p-4" : "rounded-xl border border-stone-200 bg-stone-50 p-4"}>
      <div className="bw-text-secondary text-sm font-medium">{label}</div>
      <div className="bw-text-primary mt-2 font-mono text-xl font-semibold tabular-nums">{value}</div>
      <div className="bw-text-secondary mt-1 text-xs">Demo catalogue pricing</div>
    </div>
  );
}

function Principle({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="border-t border-stone-300 pt-4">
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 max-w-[58ch] text-sm leading-6 text-stone-600">{copy}</p>
    </article>
  );
}
