"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { buildDemoProject, formatMoney } from "@/lib/buildwise";
import { ensureSeedProject } from "@/lib/project-store";

const journey = [
  "Describe the enterprise problem",
  "Assess AI suitability",
  "Select Low-code, Pro-code or Hybrid",
  "Decompose the workload",
  "Route tasks and optimise prompts",
  "Compare economics and governance",
  "Validate through a controlled test",
  "Export the implementation Build Kit",
];

const proofScreens = [
  ["intake.png", "Intake", "Defines the business, volume, quality and governance constraints."],
  ["build-path.png", "Build path", "Explains why Low-code, Pro-code or Hybrid owns each responsibility."],
  ["workflow.png", "Workflow editor", "Makes deterministic tasks, model routes and review gates editable."],
  ["scenarios.png", "Scenario economics", "Compares four policies using the same canonical workload."],
  ["build-kit.png", "Build Kit", "Turns the selected operating plan into implementation artifacts."],
  ["blueprint.png", "Blueprint", "Packages the auditable decision trail for engineering and governance."],
];

export function LandingPage() {
  const router = useRouter();
  const project = buildDemoProject();
  const baseline = project.scenarios.find((scenario) => scenario.id === "baseline")!;
  const balanced = project.scenarios.find((scenario) => scenario.id === "balanced")!;
  const deterministicTasks = project.tasks.filter((task) => !task.needsLLM).length;
  const budgetStatus = balanced.monthlyCost <= project.input.monthlyBudget ? "Within budget" : "Budget review";
  const publicDemo = process.env.NEXT_PUBLIC_BUILDWISE_PUBLIC_DEMO === "true";
  const standaloneUrl = process.env.NEXT_PUBLIC_BUILDWISE_STANDALONE_URL;
  const openDemo = () => router.push(`/workspace/${ensureSeedProject().id}/spine`);

  return (
    <div className="bw-page landing-page">
      <SiteHeader />
      <main id="main-content">
        <section className="landing-section hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Enterprise AI cost intelligence</p>
            <h1>Design AI systems for value, not token volume.</h1>
            <p className="hero-lede">
              BuildWise turns an enterprise AI idea into a cost-aware implementation blueprint - what should be deterministic, which model each task needs, how prompts and context should be designed, what the system will cost, and how it should be governed.
            </p>
            <div className="hero-actions">
              <button type="button" onClick={openDemo} className="bw-action-primary">Explore the live demo</button>
              <Link href="/new" className="bw-action-secondary">Start a new blueprint</Link>
            </div>
            <div className="hero-links">
              <a href="https://github.com/amit1858/buildwise-ai-value-architect">GitHub</a>
              <Link href="/methodology">Methodology</Link>
              <Link href="/workspace/demo-support-project/build-kit">View sample Build Kit</Link>
            </div>
          </div>

          <aside className="economics-panel" aria-label="Demo economics">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Seeded support workflow</span>
                <h2>Design estimate</h2>
              </div>
              <span className="status-badge status-neutral">Demo</span>
            </div>
            <div className="economics-grid">
              <Metric label="Monthly volume" value={project.input.executionsPerMonth.toLocaleString("en-US")} />
              <Metric label="Deterministic tasks" value={`${deterministicTasks}/${project.tasks.length}`} />
              <Metric label="Baseline estimate" value={formatMoney(baseline.monthlyCost)} />
              <Metric label="Recommended policy" value={balanced.label} />
              <Metric label="Projected cost" value={formatMoney(balanced.monthlyCost)} accent />
              <Metric label="Estimated reduction" value={`${balanced.savingsVsBaseline.toFixed(1)}%`} accent />
            </div>
            <div className="budget-line">
              <span>Budget status</span>
              <strong className={budgetStatus === "Within budget" ? "signal-success" : "signal-warning"}>{budgetStatus}</strong>
            </div>
            <details className="calculation-note">
              <summary>How this is calculated</summary>
              <p>Canonical task traces combine visible volume, token allowances, calls, retries, fallbacks and demo catalogue pricing. This is an estimate, not provider-reported usage.</p>
            </details>
          </aside>
        </section>

        <section className="landing-section problem-section" id="product">
          <div className="section-intro">
            <p className="eyebrow">The problem</p>
            <h2>Token maxxing is a system-design failure.</h2>
            <p>Model choice, prompt contracts, context size, retry behaviour and routing set the cost curve before the invoice arrives. Blunt caps reduce experimentation without repairing the architecture.</p>
          </div>
          <div className="comparison-table" aria-label="Reactive control compared with BuildWise">
            <div className="comparison-row comparison-head"><span>Reactive control</span><span>BuildWise approach</span></div>
            {[
              ["Cap usage", "Design the right workload"],
              ["Restrict prompts", "Optimise prompt contracts"],
              ["Default to one model", "Route by task complexity"],
              ["Review spend after use", "Forecast before implementation"],
              ["Govern everything equally", "Apply risk-aware review gates"],
            ].map(([left, right]) => <div className="comparison-row" key={left}><span>{left}</span><strong>{right}</strong></div>)}
          </div>
        </section>

        <section className="landing-section mechanism-section">
          <div className="section-intro">
            <p className="eyebrow">Complete mechanism</p>
            <h2>From enterprise idea to operating blueprint.</h2>
            <p>Token optimisation is one layer of the BuildWise journey, not the product itself.</p>
          </div>
          <ol className="journey-grid">
            {journey.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}
          </ol>
        </section>

        <section className="landing-section policy-section">
          <div className="section-intro">
            <p className="eyebrow">One workflow, four policies</p>
            <h2>Choose the operating posture before implementation.</h2>
            <p>Every policy exposes routing, context, retry, fallback, cache and review assumptions. Figures below use demo catalogue pricing.</p>
          </div>
          <div className="policy-grid">
            {project.scenarios.map((scenario) => (
              <article key={scenario.id} className={scenario.id === "balanced" ? "policy-card selected-card" : "policy-card"}>
                <div className="panel-heading"><h3>{scenario.label}</h3>{scenario.id === "balanced" && <span className="status-badge status-success">Recommended</span>}</div>
                <strong className="policy-cost">{formatMoney(scenario.monthlyCost)}<small>/month</small></strong>
                <p>{scenario.summary}</p>
                <dl>
                  <div><dt>Deterministic</dt><dd>{scenario.deterministicShare}%</dd></div>
                  <div><dt>Premium model</dt><dd>{scenario.premiumModelShare}%</dd></div>
                  <div><dt>Human review</dt><dd>{scenario.humanReviewRate}%</dd></div>
                  <div><dt>Trade-off</dt><dd>{scenario.keyCompromises[0]}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section paths-section">
          <div className="section-intro">
            <p className="eyebrow">Three implementation paths</p>
            <h2>Responsibility is a design decision.</h2>
            <p>The seeded scenario recommends {project.buildPaths?.find((path) => path.id === project.recommendedBuildPath)?.label} because it needs governed model use without giving up deterministic workflow control.</p>
          </div>
          <div className="path-matrix">
            <div className="path-row path-head"><span>Path</span><span>Fit</span><span>Best when</span><span>Responsibility boundary</span></div>
            {project.buildPaths?.map((path) => (
              <div className={path.id === project.recommendedBuildPath ? "path-row selected-row" : "path-row"} key={path.id}>
                <strong>{path.label}</strong><span>{path.fitScore}%</span><span>{path.summary}</span><span>{path.tradeoffs[0]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section proof-section">
          <div className="section-intro">
            <p className="eyebrow">Product proof</p>
            <h2>Every screen supports a decision.</h2>
            <p>Current product views show the path from grounded intake to implementation handoff.</p>
          </div>
          <div className="proof-grid">
            {proofScreens.map(([src, title, copy]) => (
              <figure key={src}>
                <img src={`./product-proof/${src}`} alt={`${title} screen in BuildWise`} />
                <figcaption><strong>{title}</strong><span>{copy}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="landing-section build-kit-section">
          <div className="section-intro">
            <p className="eyebrow">From estimate to implementation</p>
            <h2>The Build Kit carries the decision into delivery.</h2>
          </div>
          <div className="artifact-layout">
            <div className="artifact-list">
              {["Routing matrix", "Optimised prompt pack", "Token and cost forecast", "Budget and fallback policy", "Evaluation plan", "Observability plan", "Human-review policy", "GitHub Copilot implementation prompt", "Low-code guide", "Pro-code guide", "Hybrid responsibility map"].map((item) => <span key={item}>{item}</span>)}
            </div>
            <div className="artifact-cta">
              <p>Artifacts are generated from canonical project state, the selected scenario and the recommended build path.</p>
              <Link href="/workspace/demo-support-project/build-kit" className="bw-action-primary">Inspect the seeded Build Kit</Link>
            </div>
          </div>
        </section>

        <section className="landing-section trust-section">
          <div className="section-intro">
            <p className="eyebrow">Architecture and trust boundary</p>
            <h2>Deterministic planning stays separate from provider execution.</h2>
          </div>
          <div className="trust-grid">
            {[
              ["Canonical project state", "One project model drives workflow, economics, Blueprint and Build Kit exports."],
              ["Deterministic calculation engine", "Task traces and scenario totals are computed without a billed model call."],
              ["Provider and model registry", "Catalogue models, custom identifiers and Azure deployment names remain distinct."],
              ["Server-side adapters", "Provider requests exist only in the server-capable deployment."],
              ["Explicit provenance", "Simulation, mock adapter and live provider results are labelled separately."],
              ["Credential boundary", "Keys remain session-only and never enter public exports."],
            ].map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
          <div className="capability-boundary">
            <div>
              <span className="status-badge status-success">Public interactive demo</span>
              <p>Runs entirely as a credential-free simulation. No provider key is accepted or transmitted.</p>
            </div>
            <div>
              <span className="status-badge status-neutral">Protected standalone</span>
              <p>Configure a provider in a protected, server-hosted session to validate one controlled request.</p>
              {standaloneUrl && !publicDemo && <a href={standaloneUrl}>Open server-capable BuildWise</a>}
            </div>
          </div>
        </section>

        <section className="landing-section final-cta">
          <p className="eyebrow">Implementation starts with architecture</p>
          <h2>Build the AI operating plan before paying to run it.</h2>
          <div className="hero-actions">
            <button type="button" onClick={openDemo} className="bw-action-primary">Explore the demo</button>
            <Link href="/new" className="bw-action-secondary">Start a blueprint</Link>
            <a href="https://github.com/amit1858/buildwise-ai-value-architect" className="text-link">View GitHub</a>
            <Link href="/methodology" className="text-link">Read the methodology</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={accent ? "metric metric-accent" : "metric"}><span>{label}</span><strong>{value}</strong></div>;
}
