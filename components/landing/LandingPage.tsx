"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildDemoProject, exampleUseCases, formatMoney, type IntakeForm } from "@/lib/buildwise";
import { createProjectFromInput, ensureSeedProject } from "@/lib/project-store";

export function LandingPage() {
  const router = useRouter();
  const demoProject = buildDemoProject();
  const baseline = demoProject.scenarios.find((scenario) => scenario.id === "baseline");
  const balanced = demoProject.scenarios.find((scenario) => scenario.id === "balanced");

  const loadExample = (input: IntakeForm) => {
    const project = createProjectFromInput(input);
    router.push(`/workspace/${project.id}/spine`);
  };

  const openExisting = () => {
    const project = ensureSeedProject();
    router.push(`/workspace/${project.id}/spine`);
  };

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="mb-10 flex items-center justify-between border-b border-stone-300/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-xs font-bold text-stone-800">B</div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">BuildWise</div>
              <div className="text-xs text-stone-600">AI Value Architect</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-stone-600 md:flex">
            <Link href="/methodology">Methodology</Link>
            <Link href="/settings/providers">BYOK providers</Link>
            <button onClick={openExisting} className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:border-stone-500 hover:text-stone-900">
              Open saved project
            </button>
          </nav>
        </header>

        <section className="grid gap-8 pb-14 pt-2 lg:grid-cols-[1.14fr_0.86fr] lg:items-end">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700">Operational planning for AI programs</p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.06em] text-stone-900 md:text-5xl">
              Build the right AI system. Spend only where it adds value.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
              Turn an enterprise problem into a build-ready, budget-aware AI operating blueprint: assess suitability, separate deterministic work from model work, choose a delivery path, and show the economics behind every decision.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/new" className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700">
                Start with a blank use case
              </Link>
              <button onClick={() => router.push("/workspace/demo-support-project/spine")} className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-800 transition hover:border-stone-500">
                Try the interactive demo
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-stone-600">
              <div><span className="font-semibold text-stone-900">Suitability</span> before model choice</div>
              <div><span className="font-semibold text-stone-900">3 build paths</span> compared</div>
              <div><span className="font-semibold text-stone-900">Auditable</span> token economics</div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_18px_45px_rgba(28,25,23,0.08)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">Demo story</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">Customer-support optimisation</h2>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Demo mode</div>
            </div>
            <div className="space-y-4 text-sm text-stone-600">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Monthly volume</div>
                <div className="mt-2 text-2xl font-semibold text-stone-900">100,000</div>
                <div className="text-stone-600">interactions per month</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Naive baseline</div>
                  <div className="mt-2 text-lg font-semibold text-stone-900">{baseline?.monthlyCost === 0 ? "Unavailable" : formatMoney(baseline?.monthlyCost ?? 0)}</div>
                  <div className="text-xs text-stone-500">Demo catalogue pricing</div>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Balanced route</div>
                  <div className="mt-2 text-lg font-semibold text-stone-900">{balanced?.monthlyCost === 0 ? "Unavailable" : formatMoney(balanced?.monthlyCost ?? 0)}</div>
                  <div className="text-xs text-stone-500">Demo catalogue pricing</div>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm">
                <div className="font-medium text-stone-900">Primary result</div>
                <div className="mt-2 text-stone-600">Deterministic pre-filtering and smaller-model classification reduce token waste while preserving human review where the decision matters.</div>
                <button type="button" className="mt-4 rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700">View calculation</button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 border-y border-stone-200 py-10 md:grid-cols-3">
          {[
            ["01", "Assess the work", "Classify deterministic rules, retrieval, model-assisted tasks, and human decisions before choosing a provider."],
            ["02", "Choose how to build", "Compare Low-code, Pro-code, and Hybrid delivery with explicit ownership, trade-offs, and governance."],
            ["03", "Hand off the build", "Generate a workflow, routing matrix, prompt pack, token forecast, review policy, and implementation brief."],
          ].map(([number, title, copy]) => (
            <div key={number} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold tracking-[0.2em] text-amber-700">{number}</div>
              <h2 className="mt-3 text-lg font-semibold text-stone-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{copy}</p>
            </div>
          ))}
        </section>

        <section className="pb-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">Sample use cases</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900">Start from a grounded enterprise scenario</h2>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {exampleUseCases.map((example) => (
              <button
                key={example.projectName}
                onClick={() => loadExample(example as IntakeForm)}
                className="rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-stone-400 hover:shadow-md"
              >
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Enterprise workflow</div>
                <h3 className="text-lg font-semibold text-stone-900">{example.projectName}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">{example.problemStatement}</p>
                <div className="mt-5 text-sm font-medium text-amber-800">Open scenario →</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
