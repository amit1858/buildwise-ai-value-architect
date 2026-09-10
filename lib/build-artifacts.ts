import type { Project, ScenarioId } from "@/lib/buildwise";

export const BUILD_ARTIFACT_IDS = [
  "executive-brief",
  "ai-suitability-assessment",
  "task-decomposition",
  "model-routing-matrix",
  "prompt-pack",
  "token-and-cost-forecast",
  "budget-and-fallback-policy",
  "human-review-policy",
  "evaluation-plan",
  "observability-plan",
  "risk-register",
  "implementation-roadmap",
  "github-copilot-agent-prompt",
  "low-code-implementation-guide",
  "pro-code-implementation-guide",
  "hybrid-responsibility-map",
] as const;

export type BuildArtifactId = (typeof BUILD_ARTIFACT_IDS)[number];

export interface BuildArtifact {
  id: BuildArtifactId;
  label: string;
  fileName: string;
  summary: string;
  content: string;
  projectName: string;
  projectId: string;
  generatedAt: string;
  sourceScenario: string;
  buildPath: string;
  provenance: string;
}

export interface BuildArtifactExportBundle {
  packageName: string;
  fileName: string;
  artifacts: BuildArtifact[];
  manifest: Array<{ fileName: string; route: string; theme: string; viewport: string; capturedAt: string; sourceCommit: string; workflowRunId: string; workflowUrl: string; }>;
  combinedMarkdown: string;
}

function sanitizeSecrets(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]+/gi, "[redacted-api-key]")
    .replace(/AIza[0-9A-Za-z\-_.]{10,}/gi, "[redacted-google-key]")
    .replace(/ghp_[A-Za-z0-9]{10,}/gi, "[redacted-github-token]")
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]")
    .replace(/Authorization:\s*Bearer\s+[A-Za-z0-9._\-]+/gi, "Authorization: Bearer [redacted]");
}

function buildArtifactHeader(project: Project, title: string, summary: string, scenarioLabel: string, buildPathLabel: string): string {
  return [
    `# ${title}`,
    "",
    `Project: ${project.name}`,
    `Project ID: ${project.id}`,
    `Scenario: ${scenarioLabel}`,
    `Build path: ${buildPathLabel}`,
    `Generated at: ${new Date().toISOString()}`,
    `Provenance: ${project.demoMode ? "demo-simulation" : "project-state"}`,
    `Owner: ${project.input.targetUsers || "Product and operations owner"}`,
    "",
    summary,
    "",
    "---",
    "",
  ].join("\n");
}

function makeTaskRows(project: Project): string {
  return project.tasks
    .map((task) => `- ${task.name} (${task.taskType}) - ${task.recommendedExecutionMethod}; ${task.needsLLM ? "LLM-assisted" : "Deterministic"}; primary: ${task.primaryProvider}/${task.primaryModel}; fallback: ${task.fallbackProvider}/${task.fallbackModel}`)
    .join("\n");
}

function buildWorkloadSummary(project: Project): string {
  const budget = project.input.monthlyBudget > 0 ? `$${project.input.monthlyBudget.toLocaleString()}` : "Not set";
  return [
    `- Workload: ${project.spine.workloadCategory}`,
    `- Quality sensitivity: ${project.input.qualitySensitivity}`,
    `- Latency target: ${project.input.latencyTarget}`,
    `- Monthly budget: ${budget}`,
    `- Data sensitivity: ${project.input.dataSensitivity}`,
    `- Public demo restriction: no provider credentials are used in exported artifacts or static deployment.`,
  ].join("\n");
}

export function generateBuildArtifacts(project: Project, selectedScenarioId: ScenarioId | string = "balanced"): BuildArtifact[] {
  const selectedScenario = project.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? project.scenarios[0] ?? null;
  const buildPath = project.buildPaths?.find((item) => item.id === project.recommendedBuildPath) ?? project.buildPaths?.[0] ?? null;
  const buildPathLabel = buildPath?.label ?? "Hybrid";
  const scenarioLabel = selectedScenario?.label ?? "Balanced";
  const deterministicTaskCount = project.tasks.filter((task) => !task.needsLLM).length;
  const llmTaskCount = project.tasks.length - deterministicTaskCount;
  const promptRows = project.prompts.map((prompt) => {
    const task = project.tasks.find((item) => item.id === prompt.id) ?? project.tasks.find((item) => item.name.toLowerCase() === prompt.taskName.toLowerCase());
    return task ? { ...prompt, taskName: task.name } : prompt;
  });

  const artifacts: BuildArtifact[] = [
    {
      id: "executive-brief",
      label: "Executive brief",
      fileName: "01-executive-brief.md",
      summary: "High-level problem, value, and recommended delivery plan.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Executive brief", "Executive-level summary of the opportunity and the selected delivery route.", scenarioLabel, buildPathLabel),
        `## Outcome`,
        project.input.businessOutcome || "Define the operational outcome that this workflow must improve.",
        "",
        `## Users`,
        project.input.targetUsers || "Primary operators and reviewers.",
        "",
        `## Value hypothesis`,
        `The ${project.name} workflow reduces manual handling and improves policy reliability for ${project.input.executionsPerMonth.toLocaleString()} executions per month while staying inside a ${project.input.monthlyBudget ? `$${project.input.monthlyBudget.toLocaleString()}` : "budget"} envelope.`,
        "",
        `## Constraints`,
        buildWorkloadSummary(project),
        "",
        `## Recommendation`,
        `Use the ${buildPathLabel} build path with ${scenarioLabel} economics. This preserves governance, keeps a deterministic control layer, and preserves a visible review boundary for high-risk work.`,
      ].join("\n")),
    },
    {
      id: "ai-suitability-assessment",
      label: "AI suitability assessment",
      fileName: "02-ai-suitability-assessment.md",
      summary: "Classifies tasks into deterministic, retrieval, model-assisted, and review-heavy work.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "AI suitability assessment", "Classifies where AI adds value and where deterministic controls remain the safer choice.", scenarioLabel, buildPathLabel),
        `## Assessment`,
        `This workload is best treated as a hybrid design: ${deterministicTaskCount} deterministic tasks and ${llmTaskCount} model-assisted tasks.`,
        "",
        `## Deterministic boundary`,
        "- Routing based on explicit metadata and policy rules.",
        "- Structured validation before an answer is accepted.",
        "- Retrieval and ranking with source tracing instead of open-ended generation.",
        "",
        `## Model-assisted work`,
        "- Use model assistance only for reasoning, summarization, and exception handling.",
        "- Keep high-risk decisions behind human review.",
        "- Escalate unsupported actions rather than silently guessing.",
        "",
        `## Governance`,
        "- Do not expose provider credentials in public-demo exports.",
        "- Make all public-facing output simulation-backed and clearly labeled.",
      ].join("\n")),
    },
    {
      id: "task-decomposition",
      label: "Task decomposition",
      fileName: "03-task-decomposition.md",
      summary: "Details each task, its inputs, outputs, and execution method.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Task decomposition", "Breaks the workflow into discrete tasks with explicit inputs, outputs, and review quality gates.", scenarioLabel, buildPathLabel),
        makeTaskRows(project),
        "",
        `## Resulting execution model`,
        `The workflow favors ${project.tasks.filter((task) => !task.needsLLM).length} deterministic tasks before any model call, then uses a narrow LLM path only for the remaining ${project.tasks.filter((task) => task.needsLLM).length} judgement-heavy tasks.`,
      ].join("\n")),
    },
    {
      id: "model-routing-matrix",
      label: "Model-routing matrix",
      fileName: "04-model-routing-matrix.md",
      summary: "Captures which provider and model is recommended for each task.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Model-routing matrix", "Shows the primary and fallback route for each task, tied to the selected scenario.", scenarioLabel, buildPathLabel),
        "| Task | Type | Primary | Fallback | Reason |",
        "| --- | --- | --- | --- | --- |",
        ...project.tasks.map((task) => `| ${task.name} | ${task.taskType} | ${task.primaryProvider}/${task.primaryModel} | ${task.fallbackProvider}/${task.fallbackModel} | ${task.explanation} |`),
        "",
        `## Scenario-based routing`,
        `Selected scenario: ${scenarioLabel}. This explains the route chosen for the public demo and the project-specific guardrails.`,
      ].join("\n")),
    },
    {
      id: "prompt-pack",
      label: "Prompt pack",
      fileName: "05-prompt-pack.md",
      summary: "Contains the task-specific instructions, validation schema, and escalation guidance.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Prompt pack", "Task-specific prompt guidance and governance filters for the selected scenario.", scenarioLabel, buildPathLabel),
        ...promptRows.map((prompt) => [
          `## ${prompt.taskName}`,
          `- Deterministic? ${prompt.taskPrompt.toLowerCase().includes("deterministic") || prompt.taskName.toLowerCase().includes("retrieval") ? "Yes" : "No"}`,
          `- System instruction: ${prompt.systemInstruction}`,
          `- Optimized prompt: ${prompt.optimisedPrompt}`,
          `- Validation rules: ${prompt.validationRules.join("; ")}`,
          `- Fallback criteria: ${prompt.fallbackCriteria}`,
          `- Human escalation: ${prompt.humanEscalationCriteria}`,
          "",
        ].join("\n")),
      ].join("\n")),
    },
    {
      id: "token-and-cost-forecast",
      label: "Token and cost forecast",
      fileName: "06-token-and-cost-forecast.md",
      summary: "Shows expected token usage and cost for the selected scenario.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Token and cost forecast", "Forecasted model usage and expense for the chosen operating scenario.", scenarioLabel, buildPathLabel),
        `## Selected scenario`,
        `${scenarioLabel}: ${selectedScenario?.summary ?? "Recommended scenario summary"}`,
        "",
        `## Cost summary`,
        `- Monthly cost: ${selectedScenario ? `$${selectedScenario.monthlyCost.toLocaleString()}` : "Pricing unavailable"}`,
        `- Estimated cost per execution: ${selectedScenario ? `$${selectedScenario.estimatedCostPerExecution.toFixed(4)}` : "Not applicable"}`,
        `- Input tokens: ${selectedScenario?.inputTokens.toLocaleString() ?? "0"}`,
        `- Output tokens: ${selectedScenario?.outputTokens.toLocaleString() ?? "0"}`,
        `- Cached tokens: ${selectedScenario?.cachedTokens.toLocaleString() ?? "0"}`,
        "",
        `## Deterministic-task clarification`,
        "Deterministic tasks are never presented as billed model calls. If a deterministic path is retained for traceability, label it as 'Avoided LLM token estimate' and mark execution as 'deterministic - no model call'.",
      ].join("\n")),
    },
    {
      id: "budget-and-fallback-policy",
      label: "Budget and fallback policy",
      fileName: "07-budget-and-fallback-policy.md",
      summary: "Defines spending controls and fallback behavior under budget pressure.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Budget and fallback policy", "The cost envelope, escalation thresholds, and fallback controls for the solution.", scenarioLabel, buildPathLabel),
        `- Monthly budget: ${project.input.monthlyBudget ? `$${project.input.monthlyBudget.toLocaleString()}` : "Not set"}`,
        `- Selected scenario: ${scenarioLabel}`,
        `- Fallback policy: keep retrieval and deterministic checks in place before invoking a fallback model.`,
        `- Guardrail: public-demo exports are mock-only and do not expose provider keys or credentials.`,
      ].join("\n")),
    },
    {
      id: "human-review-policy",
      label: "Human-review policy",
      fileName: "08-human-review-policy.md",
      summary: "Lists the review gates for consequential decisions and exception handling.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Human-review policy", "Defines where a human reviewer must approve or override the automated decision.", scenarioLabel, buildPathLabel),
        "- Review all high-risk, policy-sensitive, or financially material outcomes.",
        "- Require a second person to approve any output that changes account status, billing, legal obligations, or safety posture.",
        "- Keep a visible evidence trail for each escalation and approval.",
      ].join("\n")),
    },
    {
      id: "evaluation-plan",
      label: "Evaluation plan",
      fileName: "09-evaluation-plan.md",
      summary: "Defines quality thresholds and golden tests for acceptance.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Evaluation plan", "Lists the quality gates and golden tests that govern release acceptance.", scenarioLabel, buildPathLabel),
        "- Validate schema compliance and policy adherence before production release.",
        "- Check a representative set of edge cases for ambiguity, refusal, and unsupported claims.",
        "- Confirm no provider credentials appear in the public demo or exported artifacts.",
      ].join("\n")),
    },
    {
      id: "observability-plan",
      label: "Observability plan",
      fileName: "10-observability-plan.md",
      summary: "Covers metrics, cost, latency, and quality monitoring.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Observability plan", "Defines what metrics should be captured to monitor quality, cost, and system drift.", scenarioLabel, buildPathLabel),
        "- Usage: requests, response time, retry rate, and cache hit rate.",
        "- Cost: token cost, fallback rate, provider variance, and monthly budget burn.",
        "- Quality: schema adherence, escalation volume, and review override rate.",
        "- Alert thresholds: significant variance from forecast and increases in unreviewed risk events.",
      ].join("\n")),
    },
    {
      id: "risk-register",
      label: "Risk register",
      fileName: "11-risk-register.md",
      summary: "Captures key project risks, owners, and control measures.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Risk register", "Tracks the top risks and the governance controls that mitigate them.", scenarioLabel, buildPathLabel),
        "| Risk | Impact | Likelihood | Control | Owner |",
        "| --- | --- | --- | --- | --- |",
        "| Over-broad retrieval | High | Medium | Restrict to relevant source set and require source tracing | Product owner |",
        "| Budget spikes | High | Medium | Budget guardrails and fallback policy | Operations lead |",
        "| Sensitive data leakage | High | Low | Public-demo restrictions and no credential exposure | Security owner |",
      ].join("\n")),
    },
    {
      id: "implementation-roadmap",
      label: "Implementation roadmap",
      fileName: "12-implementation-roadmap.md",
      summary: "Outlines the delivery phases and ownership for implementation.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Implementation roadmap", "Defines the phased execution plan for delivery, review, and rollout.", scenarioLabel, buildPathLabel),
        "1. Confirm the canonical workflow, the deterministic control layer, and the evidence model.",
        "2. Build the retriever, schema validation, and human review flow.",
        "3. Implement the chosen build path and measure early quality and cost.",
        "4. Validate the golden cases and document the public-demo restrictions.",
      ].join("\n")),
    },
    {
      id: "github-copilot-agent-prompt",
      label: "GitHub Copilot agent prompt",
      fileName: "13-github-copilot-agent-prompt.md",
      summary: "The project-specific prompt for a Copilot coding agent or implementation assistant.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "GitHub Copilot agent prompt", "Project-specific instructions for a coding agent implementing the chosen build path.", scenarioLabel, buildPathLabel),
        `You are helping deliver the ${project.name} workflow for a ${project.input.industry || "enterprise"} use case.`,
        "",
        `Goal: implement the ${buildPathLabel} route with explicit governance and source-backed evidence.`,
        "",
        "Requirements:",
        "- Preserve deterministic checks and human-review boundaries.",
        "- Avoid credentials or provider secrets in public-hosted exports.",
        "- Ensure the selected scenario, workload spine, build path, and artifacts remain aligned.",
        "- Do not claim live provider execution in a public static demo.",
      ].join("\n")),
    },
    {
      id: "low-code-implementation-guide",
      label: "Low-code implementation guide",
      fileName: "14-low-code-implementation-guide.md",
      summary: "Operational, connector-first guidance for low-code delivery.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Low-code implementation guide", "How to deliver the workflow with a low-code operational model.", scenarioLabel, buildPathLabel),
        "- Use approved connectors for ingestion, routing, and queueing.",
        "- Put the business logic in governed flows with clear review actions.",
        "- Keep the deterministic layer ahead of any model-based enrichment.",
      ].join("\n")),
    },
    {
      id: "pro-code-implementation-guide",
      label: "Pro-code implementation guide",
      fileName: "15-pro-code-implementation-guide.md",
      summary: "Engineering-focused implementation plan with custom retrieval and observability.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Pro-code implementation guide", "How to build the workflow with explicit retrieval, evaluation, and runtime control.", scenarioLabel, buildPathLabel),
        "- Code the retrieval layer explicitly with metadata filtering and ranking.",
        "- Add robust schema validation and a review queue for consequential decisions.",
        "- Instrument cost, latency, and quality metrics across the runtime.",
      ].join("\n")),
    },
    {
      id: "hybrid-responsibility-map",
      label: "Hybrid responsibility map",
      fileName: "16-hybrid-responsibility-map.md",
      summary: "Shows which stakeholders own each part of the hybrid operating model.",
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceScenario: scenarioLabel,
      buildPath: buildPathLabel,
      provenance: project.demoMode ? "demo-simulation" : "project-state",
      content: sanitizeSecrets([
        buildArtifactHeader(project, "Hybrid responsibility map", "Defines the ownership boundaries between product, engineering, operations, and governance.", scenarioLabel, buildPathLabel),
        "| Area | Owner | Responsibility |",
        "| --- | --- | --- |",
        "| Workflow design | Product owner | Business outcome and scope |",
        "| Retrieval and policy execution | Engineering | Deterministic controls and source-backed retrieval |",
        "| Model-assisted steps | Architecture | Prompt design and routing |",
        "| Risk and approval | Governance | Human-review policy and escalation boundaries |",
      ].join("\n")),
    },
  ];

  return artifacts;
}

export function generateCopilotInstructionsMarkdown(project: Project): string {
  const buildPath = project.buildPaths?.find((item) => item.id === project.recommendedBuildPath)?.label ?? "Hybrid";
  return sanitizeSecrets([
    `# Copilot instructions for ${project.name}`,
    "",
    "- Keep the workspace aligned to the selected scenario and build path.",
    `- Current build path: ${buildPath}`,
    `- Quality sensitivity: ${project.input.qualitySensitivity}`,
    "- Keep deterministic router logic separate from model-assisted reasoning.",
    "- Never expose provider credentials or live provider keys in public-demo outputs or exported files.",
    "- When a task is deterministic, prefer deterministic execution paths and label them as deterministic rather than as billed model calls.",
    "- Preserve the public-demo restriction: no provider-backed execution in static GitHub Pages mode.",
    "",
    "## Guardrails",
    "- Never log API keys, tokens, or authorization headers.",
    "- Prefer mock or simulated outputs for demo and public artifacts.",
    "- Keep workflow routing, scenario economics, and implementation guidance synchronized.",
  ].join("\n"));
}

export function buildCompleteExportBundle(project: Project, selectedScenarioId: ScenarioId | string = "balanced"): BuildArtifactExportBundle {
  const artifacts = generateBuildArtifacts(project, selectedScenarioId);
  const combinedMarkdown = artifacts.map((artifact) => `## ${artifact.label}\n\n${artifact.content}`).join("\n\n");
  return {
    packageName: `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-build-kit`,
    fileName: `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-build-kit.md`,
    artifacts,
    manifest: artifacts.map((artifact) => ({
      fileName: artifact.fileName,
      route: "/workspace/build-kit",
      theme: "system",
      viewport: "desktop",
      capturedAt: new Date().toISOString(),
      sourceCommit: project.id,
      workflowRunId: "build-kit-local",
      workflowUrl: "https://github.com/amit1858/buildwise-ai-value-architect/actions",
    })),
    combinedMarkdown,
  };
}
