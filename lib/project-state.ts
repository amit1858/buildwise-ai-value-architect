import { z } from "zod";
import { buildDemoProject, buildProjectFromForm, getBlankProjectInput, intakeSchema, type IntakeForm, type Project, type ProjectKind } from "@/lib/buildwise";

export const PROJECT_STATE_VERSION = 2;
export const PROJECT_INDEX_KEY = "buildwise.project.index.v2";
export const ACTIVE_PROJECT_KEY = "buildwise.project.active.v2";
const LEGACY_PROJECTS_KEY = "buildwise-projects";
const LEGACY_DRAFT_KEY = "buildwise-intake-draft";
const MIGRATION_MARKER_KEY = "buildwise.project.migrated.v2";

const persistedIntakeSchema = intakeSchema.extend({
  projectName: z.string(),
  problemStatement: z.string(),
  executionsPerMonth: z.coerce.number().finite().min(0),
});
const nonNegative = z.number().finite().min(0);
const dateSchema = z.string().datetime();
const providerSchema = z.enum(["azure-openai", "openai", "anthropic", "nvidia", "openai-compatible", "ollama", "deterministic"]);
const providerKindSchema = z.enum(["azure-openai", "openai", "anthropic", "nvidia", "openai-compatible", "ollama"]);
const taskSchema = z.object({
  id: z.string().min(1), name: z.string(), purpose: z.string(), taskType: z.string(),
  inputDescription: z.string(), outputDescription: z.string(), complexity: z.string(),
  contextRequirement: z.string(), qualityRequirement: z.string(), riskLevel: z.string(),
  needsLLM: z.boolean(), recommendedExecutionMethod: z.string(), primaryProvider: providerSchema,
  primaryModel: z.string(), fallbackProvider: providerSchema, fallbackModel: z.string(),
  promptStrategy: z.string(), estimatedInputTokens: nonNegative, estimatedOutputTokens: nonNegative,
  expectedCallsPerExecution: nonNegative, expectedRetryRate: z.number().finite().min(0).max(1),
  cacheEligible: z.boolean(), cacheHitRate: z.number().finite().min(0).max(1),
  humanReviewPolicy: z.string(), explanation: z.string(),
});
const scenarioSchema = z.object({
  id: z.enum(["baseline", "economy", "balanced", "assurance"]), label: z.string(), summary: z.string(),
  estimatedCostPerExecution: nonNegative, dailyCost: nonNegative, monthlyCost: nonNegative,
  inputTokens: nonNegative, outputTokens: nonNegative, cachedTokens: nonNegative, modelCalls: nonNegative,
  expectedLatency: z.string(), premiumModelShare: nonNegative, deterministicShare: nonNegative,
  humanReviewRate: nonNegative, budgetStatus: z.string(), savingsVsBaseline: z.number().finite(),
  keyCompromises: z.array(z.string()), primaryRisks: z.array(z.string()), confidence: z.string(),
  assumptions: z.array(z.string()), costTrace: z.object({
    modelId: z.string(), inputPricePerMillion: nonNegative, cachedInputPricePerMillion: nonNegative,
    outputPricePerMillion: nonNegative, callsPerExecution: nonNegative,
    retryRate: nonNegative, fallbackRate: nonNegative, monthlyExecutions: nonNegative,
  }).passthrough().optional(),
});
const promptSchema = z.object({
  id: z.string().min(1), taskName: z.string(), systemInstruction: z.string(), taskPrompt: z.string(),
  expectedInputPlaceholders: z.array(z.string()), outputSchema: z.string(),
  contextInclusionStrategy: z.string(), contextExclusionStrategy: z.string(), maxOutputGuidance: z.string(),
  validationRules: z.array(z.string()), retryGuidance: z.string(), fallbackCriteria: z.string(),
  humanEscalationCriteria: z.string(), originalPrompt: z.string(), optimisedPrompt: z.string(),
  changes: z.array(z.string()), estimatedTokenDifference: z.string(), riskIntroducedByCompression: z.string(),
}).passthrough();
const spineSchema = z.object({
  workloadCategory: z.string(), overallComplexity: z.string(), reasoningDepth: z.string(),
  contextIntensity: z.string(), outputPredictability: z.string(),
  qualitySensitivity: z.enum(["standard", "high", "critical"]), latencySensitivity: z.string(),
  privacyLevel: z.string(), volumeProfile: z.string(), hallucinationImpact: z.string(),
  humanReviewNeed: z.string(), deterministicControls: z.array(z.string()), mvpWedge: z.string(),
  why: z.array(z.string()),
});
const providerConfigSchema = z.object({
  id: z.string().min(1), kind: providerKindSchema, displayName: z.string(),
  endpoint: z.string().optional(), apiKey: z.string().optional(), model: z.string().optional(),
  deployment: z.string().optional(), apiVersion: z.string().optional(), region: z.string().optional(),
  safeBaseUrl: z.string().optional(), projectId: z.string().optional(), orgId: z.string().optional(),
  customHeaders: z.record(z.string(), z.string()).optional(), requiresKey: z.boolean(), keyLabel: z.string(),
  status: z.enum(["Not configured", "Incomplete", "Ready to validate", "Validating", "Connected", "Connection failed", "Local endpoint unavailable"]).optional(),
  isEnabledForSession: z.boolean().optional(), validationMessage: z.string().optional(),
  lastValidatedAt: dateSchema.optional(), selectedModel: z.string().optional(), isCustomModel: z.boolean().optional(),
  customModel: z.string().optional(), pricingStatus: z.string().optional(), sanitizedEndpoint: z.string().optional(),
});
const testRunSchema = z.object({
  id: z.string().min(1), mode: z.enum(["demo", "mocked-byok", "live-byok"]), providerId: z.string(),
  providerName: z.string(), taskId: z.string(), model: z.string(), estimatedInputTokens: nonNegative,
  estimatedOutputTokens: nonNegative, actualInputTokens: nonNegative, actualOutputTokens: nonNegative,
  cachedTokens: nonNegative, latencyMs: nonNegative, finishReason: z.string(),
  actualCost: nonNegative.nullable(), projectedMonthlyCost: nonNegative.nullable().optional(),
  pricingSource: z.string().optional(), provenance: z.enum(["demo-simulation", "mock-adapter", "live-provider"]).optional(),
  structuredValid: z.boolean(), output: z.string(), warnings: z.array(z.string()), createdAt: dateSchema,
  feedback: z.enum(["accepted", "revise", "rejected"]).optional(),
});
const projectSchema = z.object({
  id: z.string().min(1), name: z.string(), createdAt: dateSchema, updatedAt: dateSchema,
  demoMode: z.boolean(), input: persistedIntakeSchema, spine: spineSchema,
  tasks: z.array(taskSchema), scenarios: z.array(scenarioSchema), prompts: z.array(promptSchema),
  providerConfig: providerConfigSchema.nullable(), testRuns: z.array(testRunSchema),
  calibration: z.object({ inputMultiplier: nonNegative, outputMultiplier: nonNegative, sampleCount: nonNegative, updatedAt: dateSchema.optional() }),
  buildPaths: z.array(z.object({ id: z.enum(["low-code", "pro-code", "hybrid"]), label: z.string(), fitScore: z.number().finite(), summary: z.string(), strengths: z.array(z.string()), tradeoffs: z.array(z.string()), ownership: z.array(z.string()) })).optional(),
  recommendedBuildPath: z.enum(["low-code", "pro-code", "hybrid"]).optional(),
  kind: z.enum(["blank", "draft", "demo", "generated", "imported"]).optional(),
  schemaVersion: z.number().int().optional(),
  suitability: z.object({ classification: z.enum(["generative-ai", "selected-stages", "deterministic", "not-ready"]), label: z.string(), rationale: z.array(z.string()) }).optional(),
});

const storedStateSchema = z.object({
  schemaVersion: z.literal(PROJECT_STATE_VERSION),
  projectId: z.string().min(1),
  kind: z.enum(["blank", "draft", "demo", "generated", "imported"]),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  intakeStep: z.number().int().min(0).max(3),
  intake: persistedIntakeSchema,
  project: projectSchema.nullable(),
}).superRefine((value, context) => {
  if (value.project && value.project.id !== value.projectId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["project", "id"], message: "Project ID does not match stored state." });
  }
  if ((value.kind === "generated" || value.kind === "demo" || value.kind === "imported") && !value.project) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["project"], message: "Completed state requires a project." });
  }
});

export interface ProjectState {
  schemaVersion: typeof PROJECT_STATE_VERSION;
  projectId: string;
  kind: ProjectKind;
  createdAt: string;
  updatedAt: string;
  intakeStep: number;
  intake: IntakeForm;
  project: Project | null;
}

export type ProjectStateResult =
  | { ok: true; state: ProjectState }
  | { ok: false; reason: "missing" | "invalid" | "obsolete"; message: string };

function stateKey(projectId: string) {
  return `buildwise.project.v${PROJECT_STATE_VERSION}.${projectId}`;
}

function now() {
  return new Date().toISOString();
}

function randomProjectId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(PROJECT_INDEX_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]) {
  window.localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function saveProjectState(state: ProjectState): ProjectState {
  if (typeof window === "undefined") return state;
  const next = { ...state, updatedAt: now() };
  window.localStorage.setItem(stateKey(next.projectId), JSON.stringify(next));
  writeIndex([...readIndex().filter((id) => id !== next.projectId), next.projectId]);
  window.localStorage.setItem(ACTIVE_PROJECT_KEY, next.projectId);
  return next;
}

export function loadProjectState(projectId: string): ProjectStateResult {
  if (typeof window === "undefined") return { ok: false, reason: "missing", message: "Browser-local project state is unavailable during server rendering." };
  const raw = window.localStorage.getItem(stateKey(projectId));
  if (!raw) return { ok: false, reason: "missing", message: "This project is not stored in this browser." };
  try {
    const parsedJson = JSON.parse(raw) as { schemaVersion?: number };
    if (parsedJson.schemaVersion !== PROJECT_STATE_VERSION) {
      return { ok: false, reason: "obsolete", message: "This saved project uses an unsupported schema version. Export or reset it before continuing." };
    }
    const parsed = storedStateSchema.safeParse(parsedJson);
    if (!parsed.success || parsed.data.projectId !== projectId) {
      return { ok: false, reason: "invalid", message: "The saved project is invalid and was not replaced with demo data." };
    }
    return { ok: true, state: parsed.data as ProjectState };
  } catch {
    return { ok: false, reason: "invalid", message: "The saved project could not be read and was not replaced with demo data." };
  }
}

export function createBlankProjectState(): ProjectState {
  const timestamp = now();
  return saveProjectState({
    schemaVersion: PROJECT_STATE_VERSION,
    projectId: randomProjectId(),
    kind: "blank",
    createdAt: timestamp,
    updatedAt: timestamp,
    intakeStep: 0,
    intake: getBlankProjectInput(),
    project: null,
  });
}

export function createDemoProjectState(): ProjectState {
  const timestamp = now();
  const project = buildDemoProject();
  return saveProjectState({
    schemaVersion: PROJECT_STATE_VERSION,
    projectId: project.id,
    kind: "demo",
    createdAt: timestamp,
    updatedAt: timestamp,
    intakeStep: 3,
    intake: project.input,
    project,
  });
}

export function saveDraftState(projectId: string, intake: IntakeForm, intakeStep: number): ProjectState {
  const loaded = loadProjectState(projectId);
  const timestamp = now();
  return saveProjectState({
    schemaVersion: PROJECT_STATE_VERSION,
    projectId,
    kind: "draft",
    createdAt: loaded.ok ? loaded.state.createdAt : timestamp,
    updatedAt: timestamp,
    intakeStep,
    intake,
    project: loaded.ok ? loaded.state.project : null,
  });
}

export function generateProjectState(projectId: string, intake: IntakeForm): ProjectState {
  const loaded = loadProjectState(projectId);
  const project = buildProjectFromForm(intake, projectId);
  const timestamp = now();
  return saveProjectState({
    schemaVersion: PROJECT_STATE_VERSION,
    projectId,
    kind: "generated",
    createdAt: loaded.ok ? loaded.state.createdAt : timestamp,
    updatedAt: timestamp,
    intakeStep: 3,
    intake,
    project: { ...project, kind: "generated", schemaVersion: PROJECT_STATE_VERSION },
  });
}

export function listProjectStates(): ProjectState[] {
  return readIndex().map(loadProjectState).filter((result): result is { ok: true; state: ProjectState } => result.ok).map((result) => result.state);
}

export function getLatestDraft(): ProjectState | null {
  return listProjectStates()
    .filter((state) => state.kind === "draft" && Boolean(state.intake.projectName || state.intake.problemStatement))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

export function deleteProjectState(projectId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(stateKey(projectId));
  writeIndex(readIndex().filter((id) => id !== projectId));
  if (window.localStorage.getItem(ACTIVE_PROJECT_KEY) === projectId) window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
}

export function migrateLegacyBrowserState(): void {
  if (typeof window === "undefined" || window.localStorage.getItem(MIGRATION_MARKER_KEY)) return;
  const projectsRaw = window.localStorage.getItem(LEGACY_PROJECTS_KEY);
  if (projectsRaw !== null) {
    try {
      const values: unknown = JSON.parse(projectsRaw);
      if (!Array.isArray(values)) throw new Error("Legacy project collection is not an array.");
      const parsed = z.array(projectSchema).safeParse(values);
      if (!parsed.success) throw new Error("Legacy project collection is invalid.");
      for (const project of parsed.data) {
        const kind = project.id === "demo-support-project" ? "demo" : "imported";
        saveProjectState({
          schemaVersion: PROJECT_STATE_VERSION, projectId: project.id, kind,
          createdAt: project.createdAt, updatedAt: project.updatedAt, intakeStep: 3,
          intake: project.input, project: { ...project, kind, schemaVersion: PROJECT_STATE_VERSION } as Project,
        });
      }
      window.localStorage.removeItem(LEGACY_PROJECTS_KEY);
    } catch {
      // Keep malformed source intact so it can be recovered or migrated later.
    }
  }
  const draftRaw = window.localStorage.getItem(LEGACY_DRAFT_KEY);
  if (draftRaw !== null) {
    try {
      const parsed = persistedIntakeSchema.partial().safeParse(JSON.parse(draftRaw));
      if (!parsed.success) throw new Error("Legacy draft is invalid.");
      const intake = persistedIntakeSchema.parse({ ...getBlankProjectInput(), ...parsed.data });
      const state = createBlankProjectState();
      saveDraftState(state.projectId, intake, 0);
      window.localStorage.removeItem(LEGACY_DRAFT_KEY);
    } catch {
      // Keep malformed source intact so a valid project source still migrates independently.
    }
  }
  if (window.localStorage.getItem(LEGACY_PROJECTS_KEY) === null && window.localStorage.getItem(LEGACY_DRAFT_KEY) === null) {
    window.localStorage.setItem(MIGRATION_MARKER_KEY, "true");
  }
}
