"use client";

import Link from "next/link";

export function MethodologyPage() {
  return (
    <main id="main-content" className="min-h-[100dvh] bg-stone-100 px-6 py-8 text-stone-900">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between border-b border-stone-300 pb-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">BuildWise</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Methodology</h1>
          </div>
          <Link href="/" className="text-sm text-stone-700 underline-offset-2 hover:underline">Back to home</Link>
        </header>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">How estimates are produced</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
            <li>• Workload classification is deterministic and based on visible inputs such as volume, latency, review requirements, and sensitive data.</li>
            <li>• Task decomposition uses a bounded set of execution methods: deterministic rules, retrieval, small-model classification, targeted generation, and human review.</li>
            <li>• Token estimates are approximate and use labelled assumptions; they are not a claim of actual production quality.</li>
            <li>• Cost totals are computed from the visible model catalog, the selected calls-per-execution, and the retry assumptions.</li>
            <li>• A model recommendation is rejected when it fails the budget, privacy, provider, or capability constraints.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Constraints that override a model recommendation</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
            <li>• Privacy or residency requirements.</li>
            <li>• Missing price data or unsupported model capabilities.</li>
            <li>• Budget thresholds that cannot be satisfied without violating the user&apos;s minimum constraints.</li>
            <li>• Manual review requirements for regulated or consequential decisions.</li>
            <li>• Local-only or provider-approved restrictions.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Why this is a demo-first design</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            BuildWise is intentionally transparent about estimates and limitations. It shows realistic scenario economics without claiming live model quality or a measured production result. The live BYOK path is available for controlled tests, but the default product remains functional without an API key.
          </p>
        </section>
      </div>
    </main>
  );
}
