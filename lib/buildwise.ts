import { z } from "zod";
import { NVIDIA_BUILD_DEFAULT_MODEL } from "@/lib/model-registry";

export type QualitySensitivity = "standard" | "high" | "critical";
export type WorkloadMode = "batch" | "real-time" | "mixed";
export type BuilderPreference = "pro-code" | "low-code" | "architecture";
export type BuildPathId = "low-code" | "pro-code" | "hybrid";
export type ScenarioId = "baseline" | "economy" | "balanced" | "assurance";
export type ProviderKind =
  | "azure-openai"
  | "openai"
  | "anthropic"
  | "nvidia"
  | "openai-compatible"
  | "ollama";
export type OperatingMode = "demo" | "live-byok";
export type PricingSource = "verified-catalogue" | "demo-catalogue" | "user-override" | "local-infrastructure" | "missing";
export type ExecutionProvenance = "demo-simulation" | "mock-adapter" | "live-provider";
export type ProviderConnectionStatus =
  | "Not configured"
  | "Incomplete"
  | "Ready to validate"
  | "Validating"
  | "Connected"
  | "Connection failed"
  | "Local endpoint unavailable";

export const MODEL_CATALOG_VERSION = "2026.09" as const;
export const MODEL_CATALOG_VERIFIED_AT = "2026-09-08" as const;

export const intakeSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  problemStatement: z.string().min(1, "Problem statement is required"),
  targetUsers: z.string().default(""),
  businessOutcome: z.string().default(""),
  industry: z.string().default(""),
  currentProcess: z.string().default(""),
  processCost: z.coerce.number().min(0).default(0),
  expectedValue: z.coerce.number().min(0).default(0),
  executionsPerMonth: z.coerce.number().min(1).default(1000),
  typicalInputSize: z.string().default("2-5 pages"),
  typicalOutputSize: z.string().default("200-600 words"),
  attachedDocuments: z.coerce.number().min(0).default(2),
  conversationHistory: z.boolean().default(false),
  peakConcurrency: z.coerce.number().min(1).default(10),
  workloadMode: z.enum(["batch", "real-time", "mixed"]).default("mixed"),
  qualitySensitivity: z.enum(["standard", "high", "critical"]).default("high"),
  latencyTarget: z.string().default("< 3 seconds"),
  monthlyBudget: z.coerce.number().min(0).default(5000),
  dataSensitivity: z.string().default("internal"),
  dataResidency: z.boolean().default(false),
  humanReview: z.boolean().default(true),
  externalProviders: z.boolean().default(true),
  localModels: z.boolean().default(true),
  approvedProviders: z.array(z.string()).default([]),
  structuredOutput: z.boolean().default(true),
  citations: z.boolean().default(true),
  builderPreference: z.enum(["pro-code", "low-code", "architecture"]).default("pro-code"),
  sampleInput: z.string().default(""),
  confidentialWarning: z.boolean().default(true),
});

export type IntakeForm = z.infer<typeof intakeSchema>;

export interface ProviderConfig {
  id: string;
  kind: ProviderKind;
  displayName: string;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  deployment?: string;
  apiVersion?: string;
  region?: string;
  safeBaseUrl?: string;
  projectId?: string;
  orgId?: string;
  customHeaders?: Record<string, string>;
  requiresKey: boolean;
  keyLabel: string;
  status?: ProviderConnectionStatus;
  isEnabledForSession?: boolean;
  validationMessage?: string;
  lastValidatedAt?: string;
  selectedModel?: string;
  isCustomModel?: boolean;
  customModel?: string;
  pricingStatus?: string;
  sanitizedEndpoint?: string;
}

export interface ModelProfile {
  provider: ProviderKind;
  modelId: string;
  displayName: string;
  family: string;
  tier: "small" | "standard" | "advanced" | "reasoning" | "local";
  inputPricePerMillion?: number;
  cachedInputPricePerMillion?: number;
  outputPricePerMillion?: number;
  currency: "USD";
  contextWindow?: number;
  supportsStructuredOutput: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsPromptCaching: boolean;
  supportsBatch: boolean;
  suitableFor: string[];
  limitations: string[];
  pricingSource?: string;
  pricingVerifiedAt?: string;
  recommendedTemperature?: number;
  recommendedTopP?: number;
}

export interface WorkloadSpine {
  workloadCategory: string;
  overallComplexity: string;
  reasoningDepth: string;
  contextIntensity: string;
  outputPredictability: string;
  qualitySensitivity: QualitySensitivity;
  latencySensitivity: string;
  privacyLevel: string;
  volumeProfile: string;
  hallucinationImpact: string;
  humanReviewNeed: string;
  deterministicControls: string[];
  mvpWedge: string;
  why: string[];
}

export interface BuildPathRecommendation {
  id: BuildPathId;
  label: string;
  fitScore: number;
  summary: string;
  strengths: string[];
  tradeoffs: string[];
  ownership: string[];
}

export interface WorkflowTask {
  id: string;
  name: string;
  purpose: string;
  taskType: string;
  inputDescription: string;
  outputDescription: string;
  complexity: string;
  contextRequirement: string;
  qualityRequirement: string;
  riskLevel: string;
  needsLLM: boolean;
  recommendedExecutionMethod: string;
  primaryProvider: ProviderKind | "deterministic";
  primaryModel: string;
  fallbackProvider: ProviderKind | "deterministic";
  fallbackModel: string;
  promptStrategy: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  expectedCallsPerExecution: number;
  expectedRetryRate: number;
  cacheEligible: boolean;
  cacheHitRate: number;
  humanReviewPolicy: string;
  explanation: string;
}

export interface ScenarioMetric {
  id: ScenarioId;
  label: string;
  summary: string;
  estimatedCostPerExecution: number;
  dailyCost: number;
  monthlyCost: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  modelCalls: number;
  expectedLatency: string;
  premiumModelShare: number;
  deterministicShare: number;
  humanReviewRate: number;
  budgetStatus: string;
  savingsVsBaseline: number;
  keyCompromises: string[];
  primaryRisks: string[];
  confidence: string;
  assumptions: string[];
  costTrace?: {
    modelId: string;
    inputPricePerMillion: number;
    cachedInputPricePerMillion: number;
    outputPricePerMillion: number;
    callsPerExecution: number;
    retryRate: number;
    fallbackRate: number;
    monthlyExecutions: number;
    pricingStatus?: PricingSource;
    currency?: "USD";
    assumptions?: string[];
    tasks?: TaskCostTrace[];
  };
}

export interface TaskCostTrace {
  taskId: string;
  taskName: string;
  executionMethod: string;
  provider: ProviderKind | "deterministic";
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  instructionTokens: number;
  variableInputTokens: number;
  retrievedContextTokens: number;
  outputAllowance: number;
  expectedRetryTokens: number;
  expectedFallbackTokens: number;
  totalExpectedTokensPerExecution: number;
  calls: number;
  retryRate: number;
  fallbackRate: number;
  monthlyTaskVolume: number;
  inputPrice: number | null;
  cachedInputPrice: number | null;
  outputPrice: number | null;
  priceSource: string;
  priceVerificationDate?: string;
  costFormula: string;
  costPerExecution: number | null;
  monthlyCost: number | null;
  tokenTrace: TokenTrace;
}

export interface TokenTrace {
  rawInputTokens: number;
  systemInstructionTokens: number;
  userPromptTokens: number;
  retrievedContextTokens: number;
  conversationHistoryTokens: number;
  toolDefinitionTokens: number;
  expectedOutputTokens: number;
  cacheEligibleInputTokens: number;
  cacheHitRate: number;
  cachedInputTokens: number;
  uncachedInputTokens: number;
  callsPerExecution: number;
  retryRate: number;
  expectedAttempts: number;
  expectedCallsPerExecution: number;
  fallbackRate: number;
  primaryModelShare: number;
  fallbackModelShare: number;
  monthlyExecutions: number;
  monthlyCalls: number;
  tokenizerMethod: string;
  estimationMethod: string;
  confidenceBand: "low" | "medium" | "high";
  assumptions: string[];
  provenance: "pre-design-estimate" | "simulated" | "mock-adapter" | "provider-reported";
}

export interface CostTrace {
  scenarioId: ScenarioId;
  monthlyExecutions: number;
  tasks: TaskCostTrace[];
  totalInputTokensPerExecution: number;
  totalCachedInputTokensPerExecution: number;
  totalOutputTokensPerExecution: number;
  expectedCallsPerExecution: number;
  costPerExecution: number | null;
  monthlyCost: number | null;
  savingsVsBaseline: number | null;
  pricingStatus: PricingSource;
  currency: "USD";
  assumptions: string[];
}

export interface PromptPackItem {
  id: string;
  taskName: string;
  systemInstruction: string;
  taskPrompt: string;
  expectedInputPlaceholders: string[];
  outputSchema: string;
  contextInclusionStrategy: string;
  contextExclusionStrategy: string;
  maxOutputGuidance: string;
  validationRules: string[];
  retryGuidance: string;
  fallbackCriteria: string;
  humanEscalationCriteria: string;
  originalPrompt: string;
  optimisedPrompt: string;
  changes: string[];
  estimatedTokenDifference: string;
  riskIntroducedByCompression: string;
  originalPromptTokens?: number;
  optimisedPromptTokens?: number;
  tokenDifference?: number;
  percentageChange?: number;
  estimationMethod?: string;
  validationRequired?: string;
  instructionInvestment?: number;
  contextReduction?: number;
  outputReduction?: number;
  expectedRetryReduction?: number;
  netRequestImpact?: number;
  originalInputTokens?: number;
  optimisedInputTokens?: number;
  originalOutputTokens?: number;
  optimisedOutputTokens?: number;
  estimatedMonthlyTokenImpact?: number;
  estimatedMonthlyCostImpact?: number | null;
  originalExpectedTokens?: number;
  optimisedExpectedTokens?: number;
  netTokenDelta?: number;
  netTokenDeltaPercent?: number;
}

export interface ControlledTestRecord {
  id: string;
  mode: "demo" | "mocked-byok" | "live-byok";
  providerId: string;
  providerName: string;
  taskId: string;
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  actualInputTokens: number;
  actualOutputTokens: number;
  cachedTokens: number;
  latencyMs: number;
  finishReason: string;
  actualCost: number | null;
  projectedMonthlyCost?: number | null;
  pricingSource?: string;
  provenance?: ExecutionProvenance;
  structuredValid: boolean;
  output: string;
  warnings: string[];
  createdAt: string;
  feedback?: "accepted" | "revise" | "rejected";
}

export interface CalibrationState {
  inputMultiplier: number;
  outputMultiplier: number;
  sampleCount: number;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  demoMode: boolean;
  input: IntakeForm;
  spine: WorkloadSpine;
  tasks: WorkflowTask[];
  scenarios: ScenarioMetric[];
  prompts: PromptPackItem[];
  providerConfig: ProviderConfig | null;
  testRuns: ControlledTestRecord[];
  calibration: CalibrationState;
  buildPaths?: BuildPathRecommendation[];
  recommendedBuildPath?: BuildPathId;
}

export const exampleUseCases: IntakeForm[] = [
  {
    projectName: "Customer-support triage and response generation",
    problemStatement:
      "Route every inbound support contact to the right queue, pull policy context, and draft a grounded reply without overwhelming human agents.",
    targetUsers: "Support teams and operations leaders",
    businessOutcome: "Reduce average handle time and maintain policy consistency.",
    industry: "Technology",
    currentProcess: "Manual triage, document search, and handwritten response drafts.",
    processCost: 280000,
    expectedValue: 640000,
    executionsPerMonth: 100000,
    typicalInputSize: "2-8 pages of customer and policy context",
    typicalOutputSize: "150-350 words",
    attachedDocuments: 3,
    conversationHistory: true,
    peakConcurrency: 35,
    workloadMode: "mixed" as const,
    qualitySensitivity: "high" as const,
    latencyTarget: "under 4 seconds",
    monthlyBudget: 12000,
    dataSensitivity: "internal",
    dataResidency: false,
    humanReview: true,
    externalProviders: true,
    localModels: true,
    approvedProviders: ["Azure OpenAI", "OpenAI"],
    structuredOutput: true,
    citations: true,
    builderPreference: "pro-code" as const,
    sampleInput:
      "Customer reports a missing invoice, past due account, and an escalation threat; policy requires confirm identity before discussing account details.",
    confidentialWarning: true,
  },
  {
    projectName: "Enterprise account-research assistant",
    problemStatement:
      "Create a research workflow that finds account risk, buying signals, recent initiatives, and stakeholder coverage before sales outreach.",
    targetUsers: "Account teams and enterprise sales managers",
    businessOutcome: "Increase conversion quality and reduce wasted outreach.",
    industry: "B2B SaaS",
    currentProcess: "Analysts manually compile information from CRM, web pages, and call notes.",
    processCost: 175000,
    expectedValue: 420000,
    executionsPerMonth: 24000,
    typicalInputSize: "1-3 documents and CRM notes",
    typicalOutputSize: "600-1100 words",
    attachedDocuments: 5,
    conversationHistory: false,
    peakConcurrency: 12,
    workloadMode: "batch" as const,
    qualitySensitivity: "high" as const,
    latencyTarget: "under 20 seconds",
    monthlyBudget: 9000,
    dataSensitivity: "confidential",
    dataResidency: true,
    humanReview: true,
    externalProviders: false,
    localModels: true,
    approvedProviders: ["Azure OpenAI", "NVIDIA"],
    structuredOutput: true,
    citations: true,
    builderPreference: "architecture" as const,
    sampleInput:
      "Summarize recent funding events, recent product launches, and buying committee members for a global manufacturing account.",
    confidentialWarning: true,
  },
  {
    projectName: "Contract review workflow",
    problemStatement:
      "Review vendor contracts for obligations, risky clauses, and approval thresholds while keeping a defensible human review step.",
    targetUsers: "Legal and procurement teams",
    businessOutcome: "Reduce contract review time while improving policy compliance.",
    industry: "Enterprise services",
    currentProcess: "Manual legal review and comparison against standard templates.",
    processCost: 220000,
    expectedValue: 580000,
    executionsPerMonth: 18000,
    typicalInputSize: "10-40 pages of legal text",
    typicalOutputSize: "1-3 page summary with exceptions",
    attachedDocuments: 6,
    conversationHistory: false,
    peakConcurrency: 8,
    workloadMode: "batch" as const,
    qualitySensitivity: "critical" as const,
    latencyTarget: "under 30 seconds",
    monthlyBudget: 15000,
    dataSensitivity: "regulated",
    dataResidency: true,
    humanReview: true,
    externalProviders: false,
    localModels: true,
    approvedProviders: ["Azure OpenAI"],
    structuredOutput: true,
    citations: true,
    builderPreference: "pro-code" as const,
    sampleInput:
      "Highlight non-standard indemnity, renewal, and data-residency terms in a procurement agreement and assess risk level.",
    confidentialWarning: true,
  },
];

export function getDefaultProjectInput(): IntakeForm {
  return {
    projectName: "Enterprise customer-support optimisation",
    problemStatement:
      "Reduce support operating cost while improving response quality for a large customer base with policy-sensitive decisions.",
    targetUsers: "Support managers, policy owners, and frontline agents",
    businessOutcome: "Increase first-response quality while keeping cost under budget.",
    industry: "Technology",
    currentProcess: "Agents manually triage, look up policies, and draft responses from multiple systems.",
    processCost: 280000,
    expectedValue: 640000,
    executionsPerMonth: 100000,
    typicalInputSize: "2-8 pages of customer and policy context",
    typicalOutputSize: "150-350 words",
    attachedDocuments: 3,
    conversationHistory: true,
    peakConcurrency: 35,
    workloadMode: "mixed",
    qualitySensitivity: "high",
    latencyTarget: "under 4 seconds",
    monthlyBudget: 12000,
    dataSensitivity: "internal",
    dataResidency: false,
    humanReview: true,
    externalProviders: true,
    localModels: true,
    approvedProviders: ["Azure OpenAI", "OpenAI"],
    structuredOutput: true,
    citations: true,
    builderPreference: "pro-code",
    sampleInput:
      "Customer reports a billing mismatch and asks for an escalation; find policy context, detect risk, and draft a response with the correct next step.",
    confidentialWarning: true,
  };
}

export function estimateTokenRange(
  text: string,
  expectedSize = 0
): { min: number; expected: number; max: number; confidence: string; method: string } {
  const base = Math.max(20, text.length || 0);
  const expected = expectedSize > 0 ? expectedSize : Math.max(80, Math.round(base / 4));
  const min = Math.max(40, Math.round(expected * 0.7));
  const max = Math.round(expected * 1.4 + 60);
  return {
    min,
    expected,
    max,
    confidence: expected > 2000 ? "medium" : "high",
    method: "character-based approximation",
  };
}

export const modelCatalogue: ModelProfile[] = [
  {
    provider: "azure-openai",
    modelId: "gpt-4.1-mini",
    displayName: "GPT-4.1 mini",
    family: "GPT-4.1",
    tier: "standard",
    inputPricePerMillion: 0.75,
    cachedInputPricePerMillion: 0.15,
    outputPricePerMillion: 1.5,
    currency: "USD",
    contextWindow: 1_000_000,
    supportsStructuredOutput: true,
    supportsTools: true,
    supportsVision: false,
    supportsPromptCaching: true,
    supportsBatch: true,
    suitableFor: ["Classification", "Extraction", "Transformation", "Generation"],
    limitations: ["Moderate reasoning depth"],
    pricingSource: "catalogue configuration",
    pricingVerifiedAt: MODEL_CATALOG_VERIFIED_AT,
  },
  {
    provider: "azure-openai",
    modelId: "gpt-4.1",
    displayName: "GPT-4.1",
    family: "GPT-4.1",
    tier: "advanced",
    inputPricePerMillion: 5.5,
    cachedInputPricePerMillion: 1.2,
    outputPricePerMillion: 11,
    currency: "USD",
    contextWindow: 1_000_000,
    supportsStructuredOutput: true,
    supportsTools: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsBatch: true,
    suitableFor: ["Complex reasoning", "Generation", "Validation", "Tool selection"],
    limitations: ["Higher cost; use only when risk or complexity justify it"],
    pricingSource: "catalogue configuration",
    pricingVerifiedAt: MODEL_CATALOG_VERIFIED_AT,
  },
  {
    provider: "openai",
    modelId: "gpt-4o-mini",
    displayName: "GPT-4o mini",
    family: "GPT-4o",
    tier: "small",
    inputPricePerMillion: 0.15,
    cachedInputPricePerMillion: 0.03,
    outputPricePerMillion: 0.6,
    currency: "USD",
    contextWindow: 128_000,
    supportsStructuredOutput: true,
    supportsTools: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsBatch: true,
    suitableFor: ["Classification", "Extraction", "Summarisation"],
    limitations: ["Limited suitability for deep reasoning"],
    pricingSource: "catalogue configuration",
    pricingVerifiedAt: MODEL_CATALOG_VERIFIED_AT,
  },
  {
    provider: "anthropic",
    modelId: "claude-3-5-haiku",
    displayName: "Claude 3.5 Haiku",
    family: "Claude 3.5",
    tier: "small",
    inputPricePerMillion: 0.8,
    cachedInputPricePerMillion: 0.08,
    outputPricePerMillion: 4,
    currency: "USD",
    contextWindow: 200_000,
    supportsStructuredOutput: true,
    supportsTools: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsBatch: true,
    suitableFor: ["Classification", "Summarisation", "Extraction"],
    limitations: ["Not ideal for long-horizon agent work"],
    pricingSource: "catalogue configuration",
    pricingVerifiedAt: MODEL_CATALOG_VERIFIED_AT,
  },
  {
    provider: "nvidia",
    modelId: NVIDIA_BUILD_DEFAULT_MODEL,
    displayName: "NVIDIA Nemotron 3.5 Lightning 30B A3B",
    family: "Nemotron 3.5",
    tier: "standard",
    currency: "USD",
    contextWindow: 1_000_000,
    supportsStructuredOutput: true,
    supportsTools: true,
    supportsVision: false,
    supportsPromptCaching: false,
    supportsBatch: false,
    suitableFor: ["Agentic workflows", "Long-context reasoning", "Generation"],
    limitations: ["Pricing is not configured in BuildWise until provider-reported usage or catalogue pricing is available"],
    pricingSource: "missing",
    pricingVerifiedAt: "2026-08-11",
    recommendedTemperature: 1,
    recommendedTopP: 0.95,
  },
  {
    provider: "ollama",
    modelId: "llama3.1:8b",
    displayName: "Llama 3.1 8B",
    family: "Llama",
    tier: "local",
    currency: "USD",
    contextWindow: 128_000,
    supportsStructuredOutput: true,
    supportsTools: false,
    supportsVision: false,
    supportsPromptCaching: false,
    supportsBatch: true,
    suitableFor: ["Classification", "Summarisation", "Deterministic calculation"],
    limitations: ["Pricing not configured; local infrastructure cost must be entered manually"],
    pricingSource: "user override",
    pricingVerifiedAt: MODEL_CATALOG_VERIFIED_AT,
  },
];

export function getModelById(modelId: string): ModelProfile | undefined {
  return modelCatalogue.find((model) => model.modelId === modelId);
}

export function calculateScenarioCost(
  modelId: string,
  uncachedInputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
  callsPerExecution: number,
  retryRate: number,
  monthlyExecutions: number,
  taskCount = 1
): { expectedExecutionCost: number; dailyCost: number; monthlyCost: number; cachedCost: number; uncachedCost: number; outputCost: number; } {
  const model = getModelById(modelId) ?? modelCatalogue[0];

  const uncachedInputCost =
    (uncachedInputTokens / 1_000_000) * (model.inputPricePerMillion ?? 0);
  const cachedInputCost =
    (cachedInputTokens / 1_000_000) * (model.cachedInputPricePerMillion ?? 0);
  const outputCost =
    (outputTokens / 1_000_000) * (model.outputPricePerMillion ?? 0);

  const executionCost =
    (uncachedInputCost + cachedInputCost + outputCost) *
    callsPerExecution *
    (1 + retryRate) *
    taskCount;

  const dailyExecutions = monthlyExecutions / 30;
  const dailyCost = executionCost * dailyExecutions;
  const monthlyCost = executionCost * monthlyExecutions;

  return {
    expectedExecutionCost: executionCost,
    dailyCost,
    monthlyCost,
    uncachedCost: uncachedInputCost,
    cachedCost: cachedInputCost,
    outputCost,
  };
}

export function formatMoney(amount: number, currency = "USD") {
  return formatCost(amount, "priced", currency);
}

export function formatCost(amount: number | null | undefined, kind: "priced" | "unavailable" | "deterministic" = "priced", currency = "USD") {
  if (kind === "deterministic") return "Not applicable";
  if (kind === "unavailable" || amount === null || amount === undefined) return "Pricing unavailable";
  if (amount === 0) return "$0.00";
  if (amount > 0 && amount < 0.01) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getPriceStatusLabel(modelId: string): string {
  const model = getModelById(modelId);
  if (!model) return "Pricing not configured.";
  const hasPrice = model.inputPricePerMillion !== undefined || model.outputPricePerMillion !== undefined;
  return hasPrice ? `${model.pricingSource ?? "catalogue configuration"}` : "Pricing not configured.";
}

export const DEMO_CATALOGUE_VERSION = "BuildWise demo catalogue 2026.09";
export const DEMO_CATALOGUE_EFFECTIVE_DATE = "2026-09-08";

function getPromptTokenEstimate(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function getTaskPricing(task: WorkflowTask) {
  if (!task.needsLLM || task.primaryModel === "Deterministic retrieval") return null;
  return getModelById(task.primaryModel);
}

function getScenarioTaskPolicy(task: WorkflowTask, scenarioId: ScenarioId): WorkflowTask {
  if (scenarioId === "baseline") {
    return {
      ...task,
      needsLLM: true,
      primaryProvider: "openai",
      primaryModel: "gpt-4.1",
      fallbackProvider: "openai",
      fallbackModel: "gpt-4.1-mini",
      estimatedInputTokens: Math.round(task.estimatedInputTokens * 1.8),
      estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 1.4),
      expectedCallsPerExecution: 1,
      expectedRetryRate: 0.08,
      cacheEligible: true,
      cacheHitRate: 0.1,
      recommendedExecutionMethod: "Single advanced model with broad context and minimal filtering",
    };
  }
  if (scenarioId === "economy") {
    const deterministic = task.id === "triage" || task.id === "policy" || task.id === "validate";
    return {
      ...task,
      needsLLM: !deterministic,
      primaryProvider: deterministic ? "deterministic" : "openai",
      primaryModel: deterministic ? "Deterministic execution" : "gpt-4o-mini",
      fallbackProvider: deterministic ? "deterministic" : "openai",
      fallbackModel: deterministic ? "Human review" : "gpt-4o-mini",
      estimatedInputTokens: Math.round(task.estimatedInputTokens * 0.7),
      estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 0.65),
      expectedCallsPerExecution: deterministic ? 0 : 1,
      expectedRetryRate: deterministic ? 0 : 0.03,
      cacheEligible: true,
      cacheHitRate: 0.65,
      recommendedExecutionMethod: deterministic ? "Deterministic rules and retrieval" : "Small model with strict context and output caps",
    };
  }
  if (scenarioId === "assurance") {
    return {
      ...task,
      needsLLM: task.id !== "policy",
      primaryProvider: task.id === "policy" ? "deterministic" : "azure-openai",
      primaryModel: task.id === "policy" ? "Deterministic execution" : task.id === "draft" || task.id === "validate" ? "gpt-4.1" : "gpt-4.1-mini",
      fallbackProvider: task.id === "policy" ? "deterministic" : "azure-openai",
      fallbackModel: task.id === "policy" ? "Human review" : "gpt-4.1",
      estimatedInputTokens: Math.round(task.estimatedInputTokens * 1.35),
      estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 1.2),
      expectedCallsPerExecution: task.id === "validate" ? 2 : task.id === "policy" ? 0 : 1,
      expectedRetryRate: 0.1,
      cacheEligible: true,
      cacheHitRate: 0.25,
      recommendedExecutionMethod: task.id === "policy" ? "Deterministic retrieval with evidence gate" : "High-assurance model with validation and human escalation",
    };
  }
  const deterministic = task.id === "triage" || task.id === "policy";
  return {
    ...task,
    needsLLM: !deterministic,
    primaryProvider: deterministic ? "deterministic" : "azure-openai",
    primaryModel: deterministic ? "Deterministic execution" : task.id === "draft" ? "gpt-4.1-mini" : "gpt-4o-mini",
    fallbackProvider: deterministic ? "deterministic" : "openai",
    fallbackModel: deterministic ? "Human review" : "gpt-4o-mini",
    estimatedInputTokens: Math.round(task.estimatedInputTokens * 0.85),
    estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 0.8),
    expectedCallsPerExecution: deterministic ? 0 : 1,
    expectedRetryRate: task.id === "validate" ? 0.04 : 0.03,
    cacheEligible: true,
    cacheHitRate: 0.5,
    recommendedExecutionMethod: deterministic ? "Deterministic routing and filtered retrieval" : "Selective model execution with schema validation",
  };
}

export function calculateTaskCostTrace(task: WorkflowTask, monthlyExecutions: number, scenarioId: ScenarioId): TaskCostTrace {
  const model = getTaskPricing(task);
  const calls = task.expectedCallsPerExecution;
  const retryMultiplier = 1 + task.expectedRetryRate;
  const fallbackMultiplier = 1 + (scenarioId === "assurance" ? 0.08 : scenarioId === "economy" ? 0.03 : 0.05);
  const uncached = Math.max(0, task.estimatedInputTokens - (task.cacheEligible ? Math.round(task.estimatedInputTokens * task.cacheHitRate) : 0));
  const cached = task.cacheEligible ? Math.round(task.estimatedInputTokens * task.cacheHitRate) : 0;
  const inputPrice = model?.inputPricePerMillion ?? null;
  const cachedInputPrice = model?.cachedInputPricePerMillion ?? null;
  const outputPrice = model?.outputPricePerMillion ?? null;
  const instructionTokens = getPromptTokenEstimate(task.promptStrategy);
  const retrievedContextTokens = Math.round(uncached * (task.contextRequirement === "High" ? 0.55 : task.contextRequirement === "Medium" ? 0.4 : 0.25));
  const variableInputTokens = Math.max(0, uncached - retrievedContextTokens - instructionTokens);
  const outputAllowance = task.estimatedOutputTokens;
  const expectedRetryTokens = Math.round((uncached + cached + outputAllowance) * task.expectedRetryRate);
  const expectedFallbackTokens = Math.round((uncached + cached + outputAllowance) * (fallbackMultiplier - 1));
  const totalExpectedTokensPerExecution = uncached + cached + outputAllowance + expectedRetryTokens + expectedFallbackTokens;
  const priceAvailable = !task.needsLLM || (Boolean(model) && inputPrice !== null && outputPrice !== null);
  const baseCost = priceAvailable
    ? ((uncached / 1_000_000) * (inputPrice ?? 0)) + ((cached / 1_000_000) * (cachedInputPrice ?? inputPrice ?? 0)) + ((task.estimatedOutputTokens / 1_000_000) * (outputPrice ?? 0))
    : 0;
  const costPerExecution = baseCost === null ? null : baseCost * calls * retryMultiplier * fallbackMultiplier;
  return {
    taskId: task.id,
    taskName: task.name,
    executionMethod: task.recommendedExecutionMethod,
    provider: model?.provider ?? "deterministic",
    model: task.primaryModel,
    inputTokens: uncached,
    cachedInputTokens: cached,
    outputTokens: task.estimatedOutputTokens,
    instructionTokens,
    variableInputTokens,
    retrievedContextTokens,
    outputAllowance,
    expectedRetryTokens,
    expectedFallbackTokens,
    totalExpectedTokensPerExecution,
    calls,
    retryRate: task.expectedRetryRate,
    fallbackRate: fallbackMultiplier - 1,
    monthlyTaskVolume: monthlyExecutions,
    inputPrice,
    cachedInputPrice,
    outputPrice,
    priceSource: !task.needsLLM ? "Deterministic execution — no model price" : model ? "Demo catalogue pricing" : "Pricing unavailable",
    priceVerificationDate: model?.pricingVerifiedAt,
    costFormula: `${monthlyExecutions.toLocaleString("en-US")} executions x ${calls.toFixed(2)} calls x ${(retryMultiplier * fallbackMultiplier).toFixed(3)} retry/fallback factor x [${uncached.toLocaleString("en-US")} uncached input x input rate + ${cached.toLocaleString("en-US")} cached input x cached-input rate + ${task.estimatedOutputTokens.toLocaleString("en-US")} output x output rate]`,
    costPerExecution,
    monthlyCost: costPerExecution === null ? null : costPerExecution * monthlyExecutions,
    tokenTrace: {
      rawInputTokens: task.estimatedInputTokens,
      systemInstructionTokens: instructionTokens,
      userPromptTokens: variableInputTokens,
      retrievedContextTokens,
      conversationHistoryTokens: task.inputDescription.toLowerCase().includes("history") ? Math.round(task.estimatedInputTokens * 0.15) : 0,
      toolDefinitionTokens: task.needsLLM && task.primaryModel !== "Deterministic execution" ? 24 : 0,
      expectedOutputTokens: outputAllowance,
      cacheEligibleInputTokens: task.cacheEligible ? task.estimatedInputTokens : 0,
      cacheHitRate: task.cacheHitRate,
      cachedInputTokens: cached,
      uncachedInputTokens: uncached,
      callsPerExecution: calls,
      retryRate: task.expectedRetryRate,
      expectedAttempts: retryMultiplier,
      expectedCallsPerExecution: calls * retryMultiplier,
      fallbackRate: fallbackMultiplier - 1,
      primaryModelShare: Math.max(0, 1 - (fallbackMultiplier - 1)),
      fallbackModelShare: fallbackMultiplier - 1,
      monthlyExecutions,
      monthlyCalls: monthlyExecutions * calls * retryMultiplier,
      tokenizerMethod: "Approximation: prompt text estimate, task assumption, and documented workload inputs",
      estimationMethod: "Pre-design scenario forecast",
      confidenceBand: task.needsLLM ? "medium" : "high",
      assumptions: [
        "Retry and fallback values are expected rates, not observed provider behavior.",
        "Retrieved context is bounded by the selected scenario policy.",
      ],
      provenance: "pre-design-estimate",
    },
  };
}

export function calculateCostTrace(tasks: WorkflowTask[], input: IntakeForm, scenarioId: ScenarioId): CostTrace {
  const taskTraces = tasks.map((task) => calculateTaskCostTrace(getScenarioTaskPolicy(task, scenarioId), input.executionsPerMonth, scenarioId));
  const priced = taskTraces.filter((task) => task.provider !== "deterministic").every((task) => task.costPerExecution !== null);
  const costPerExecution = priced ? taskTraces.reduce((sum, task) => sum + (task.costPerExecution ?? 0), 0) : null;
  const monthlyCost = costPerExecution === null ? null : costPerExecution * input.executionsPerMonth;
  const baseline = scenarioId === "baseline" ? monthlyCost : null;
  return {
    scenarioId,
    monthlyExecutions: input.executionsPerMonth,
    tasks: taskTraces,
    totalInputTokensPerExecution: taskTraces.reduce((sum, task) => sum + task.inputTokens, 0),
    totalCachedInputTokensPerExecution: taskTraces.reduce((sum, task) => sum + task.cachedInputTokens, 0),
    totalOutputTokensPerExecution: taskTraces.reduce((sum, task) => sum + task.outputTokens, 0),
    expectedCallsPerExecution: taskTraces.reduce((sum, task) => sum + task.calls, 0),
    costPerExecution,
    monthlyCost,
    savingsVsBaseline: baseline === null || monthlyCost === null ? null : 0,
    pricingStatus: priced ? "demo-catalogue" : "missing",
    currency: "USD",
    assumptions: [
      "Token counts are per task execution unless explicitly labelled monthly.",
      "Retry and fallback rates are expected multipliers, not measured quality.",
      "Demo totals use the versioned BuildWise demo catalogue.",
    ],
  };
}

export function calculateScenarioTraces(tasks: WorkflowTask[], input: IntakeForm): Record<ScenarioId, CostTrace> {
  const scenarioIds: ScenarioId[] = ["baseline", "economy", "balanced", "assurance"];
  const traces = Object.fromEntries(scenarioIds.map((id) => [id, calculateCostTrace(tasks, input, id)])) as Record<ScenarioId, CostTrace>;
  const baseline = traces.baseline.monthlyCost;
  for (const trace of Object.values(traces)) {
    trace.savingsVsBaseline = baseline === null || trace.monthlyCost === null ? null : Number(((1 - trace.monthlyCost / baseline) * 100).toFixed(1));
  }
  return traces;
}

export function calculateUsageCostTrace({
  modelId,
  uncachedInputTokens,
  cachedInputTokens,
  outputTokens,
  callsPerExecution,
  retryRate,
  monthlyExecutions,
  fallbackRate,
}: {
  modelId: string;
  uncachedInputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  callsPerExecution: number;
  retryRate: number;
  monthlyExecutions: number;
  fallbackRate?: number;
}): {
  total: number;
  priceSource: string;
  inputCost: number;
  cachedCost: number;
  outputCost: number;
  callsPerExecution: number;
  retryRate: number;
  fallbackRate: number;
  monthlyExecutions: number;
  model: ModelProfile | undefined;
} {
  const model = getModelById(modelId) ?? modelCatalogue[0];
  const callRate = typeof fallbackRate === "number" ? fallbackRate : 0;
  const inputCost = (uncachedInputTokens / 1_000_000) * (model.inputPricePerMillion ?? 0);
  const cachedCost = (cachedInputTokens / 1_000_000) * (model.cachedInputPricePerMillion ?? 0);
  const outputCost = (outputTokens / 1_000_000) * (model.outputPricePerMillion ?? 0);
  const total = (inputCost + cachedCost + outputCost) * callsPerExecution * (1 + retryRate + callRate) * monthlyExecutions;
  return {
    total,
    priceSource: getPriceStatusLabel(modelId),
    inputCost,
    cachedCost,
    outputCost,
    callsPerExecution,
    retryRate,
    fallbackRate: callRate,
    monthlyExecutions,
    model,
  };
}

export function getDemoSampleEstimate() {
  const input = getDefaultProjectInput();
  return calculateCostTrace(makeWorkflowTasks(input), input, "balanced").monthlyCost ?? 0;
}

function makeWorkflowTasks(input: IntakeForm): WorkflowTask[] {
  const baseScore = Math.max(5, Math.min(12, Math.round((input.executionsPerMonth || 1000) / 15000)));

  const tasks: WorkflowTask[] = [
    {
      id: "triage",
      name: "Case triage",
      purpose: "Classify the interaction and severity before any expensive work begins.",
      taskType: "Classification",
      inputDescription: "Customer message, history, and route metadata.",
      outputDescription: "Priority, issue category, and required next step.",
      complexity: "Low",
      contextRequirement: "Low",
      qualityRequirement: "High",
      riskLevel: "Medium",
      needsLLM: true,
      recommendedExecutionMethod: "Deterministic pre-filtering plus small-model classification",
      primaryProvider: "openai",
      primaryModel: "gpt-4o-mini",
      fallbackProvider: "anthropic",
      fallbackModel: "claude-3-5-haiku",
      promptStrategy: "Short classification schema with several examples and escalation rules.",
      estimatedInputTokens: 2200,
      estimatedOutputTokens: 180,
      expectedCallsPerExecution: 1,
      expectedRetryRate: 0.08,
      cacheEligible: true,
      cacheHitRate: 0.3,
      humanReviewPolicy: "Human review for critical escalations and policy-sensitive categories.",
      explanation:
        "This step is frequent, bounded, and should be fast. A smaller model handles the classification at scale while deterministic logic keeps routing safe.",
    },
    {
      id: "extract",
      name: "Information extraction",
      purpose: "Capture the customer issue, product details, and relevant account facts in a structured format.",
      taskType: "Extraction",
      inputDescription: "Support email, chat transcript, and account metadata.",
      outputDescription: "Fields such as product, action, risk, and sentiment.",
      complexity: "Medium",
      contextRequirement: "Medium",
      qualityRequirement: "High",
      riskLevel: "Medium",
      needsLLM: true,
      recommendedExecutionMethod: "Structured output model with schema validation and retrieval cache",
      primaryProvider: "azure-openai",
      primaryModel: "gpt-4.1-mini",
      fallbackProvider: "openai",
      fallbackModel: "gpt-4o-mini",
      promptStrategy: "Schema-first extraction with a compact policy context window.",
      estimatedInputTokens: 5600,
      estimatedOutputTokens: 420,
      expectedCallsPerExecution: 1,
      expectedRetryRate: 0.05,
      cacheEligible: true,
      cacheHitRate: 0.3,
      humanReviewPolicy: "Review when output confidence is low or when field extraction is incomplete.",
      explanation:
        "Structured extraction is repeatable and benefits from a constrained schema and low output size. This prevents broad-context prompts from creating unnecessary cost.",
    },
    {
      id: "policy",
      name: "Policy retrieval",
      purpose: "Fetch the relevant policy or playbook before drafting a response.",
      taskType: "Retrieval",
      inputDescription: "Search index, policy library, and issue context.",
      outputDescription: "Most relevant clauses and decision boundaries.",
      complexity: "Low",
      contextRequirement: "High",
      qualityRequirement: "High",
      riskLevel: "High",
      needsLLM: false,
      recommendedExecutionMethod: "Search, semantic retrieval, and deterministic policy matching",
      primaryProvider: "deterministic",
      primaryModel: "Deterministic retrieval",
      fallbackProvider: "deterministic",
      fallbackModel: "Human review",
      promptStrategy: "Rank and filter evidence before response generation.",
      estimatedInputTokens: 3200,
      estimatedOutputTokens: 300,
      expectedCallsPerExecution: 2,
      expectedRetryRate: 0.12,
      cacheEligible: true,
      cacheHitRate: 0.3,
      humanReviewPolicy: "Human approval required for policy exceptions and customer-impacting decisions.",
      explanation:
        "Retrieval should be deterministic wherever possible. It narrows the model context to only the required policy facts and materially reduces token cost.",
    },
    {
      id: "draft",
      name: "Response generation",
      purpose: "Draft a customer-safe response based on extracted facts and policy evidence.",
      taskType: "Generation",
      inputDescription: "Triage result, extracted facts, and relevant policy text.",
      outputDescription: "Customer-facing response plus optional next-step suggestions.",
      complexity: "Medium",
      contextRequirement: "High",
      qualityRequirement: "High",
      riskLevel: "High",
      needsLLM: true,
      recommendedExecutionMethod: "Advanced model only for ambiguous or high-risk replies",
      primaryProvider: "azure-openai",
      primaryModel: "gpt-4.1-mini",
      fallbackProvider: "azure-openai",
      fallbackModel: "gpt-4.1",
      promptStrategy: "Prompt-compressed context, explicit tone and policy guardrails, and output schema.",
      estimatedInputTokens: 6400,
      estimatedOutputTokens: 520,
      expectedCallsPerExecution: 1,
      expectedRetryRate: 0.06,
      cacheEligible: true,
      cacheHitRate: 0.3,
      humanReviewPolicy: "Review all high-risk, legal, or escalated actions before sending.",
      explanation:
        "This is the business-visible step, but it should not consume broad context by default. The response should be generated from the narrow evidence set, not the full conversation.",
    },
    {
      id: "validate",
      name: "Escalation and compliance validation",
      purpose: "Check for safety, quality, and policy exceptions before a response is approved.",
      taskType: "Validation",
      inputDescription: "Drafted response, policy checks, and risk indicators.",
      outputDescription: "Approved, revised, or escalated status with reasons.",
      complexity: "Medium",
      contextRequirement: "Medium",
      qualityRequirement: "Critical",
      riskLevel: "High",
      needsLLM: true,
      recommendedExecutionMethod: "Deterministic rules with a targeted validation model for exceptions",
      primaryProvider: "openai",
      primaryModel: "gpt-4o-mini",
      fallbackProvider: "azure-openai",
      fallbackModel: "gpt-4.1",
      promptStrategy: "Binary pass/fail validation output with explicit guardrails and escalation triggers.",
      estimatedInputTokens: 4100,
      estimatedOutputTokens: 220,
      expectedCallsPerExecution: 1,
      expectedRetryRate: 0.04,
      cacheEligible: true,
      cacheHitRate: 0.3,
      humanReviewPolicy: "Escalate all critical or policy-sensitive exceptions to a human reviewer.",
      explanation:
        "Validation is a good place for deterministic guardrails, with a smaller model used only where a second check is warranted. This limits expensive escalation calls.",
    },
  ];
  return tasks.map((task, index) => ({
    ...task,
    complexity: task.complexity,
    qualityRequirement: task.qualityRequirement,
    contextRequirement: task.contextRequirement,
    cacheHitRate: task.cacheEligible ? 0.3 : 0,
    estimatedInputTokens: task.estimatedInputTokens + baseScore * index * 120,
    estimatedOutputTokens: task.estimatedOutputTokens + baseScore * (index + 1) * 30,
  }));
}

export function buildProjectFromForm(form: IntakeForm, projectId = `project-${Date.now()}`): Project {
  const cleaned = intakeSchema.parse(form);
  const months = Math.max(1, cleaned.executionsPerMonth || 1000);
  const tasks = makeWorkflowTasks(cleaned);

  const spine: WorkloadSpine = {
    workloadCategory: cleaned.problemStatement.toLowerCase().includes("support") ? "Customer operations automation" : "Knowledge-intensive workflow",
    overallComplexity: cleaned.executionsPerMonth > 80000 ? "High" : "Medium",
    reasoningDepth: cleaned.qualitySensitivity === "critical" ? "Deep" : cleaned.qualitySensitivity === "high" ? "Medium" : "Light",
    contextIntensity: cleaned.conversationHistory || cleaned.attachedDocuments > 2 ? "High" : "Medium",
    outputPredictability: cleaned.structuredOutput ? "High" : "Medium",
    qualitySensitivity: cleaned.qualitySensitivity,
    latencySensitivity: cleaned.latencyTarget.includes("second") ? "Operationally sensitive" : "Moderate",
    privacyLevel: cleaned.dataSensitivity === "regulated" || cleaned.conversationHistory || cleaned.humanReview || cleaned.externalProviders ? "High" : cleaned.dataSensitivity === "confidential" ? "Medium" : "Low",
    volumeProfile: months > 50000 ? "High-volume" : months > 10000 ? "Medium-volume" : "Low-volume",
    hallucinationImpact: cleaned.qualitySensitivity === "critical" ? "High" : "Medium",
    humanReviewNeed: cleaned.humanReview ? "Required for exceptions" : "Optional",
    deterministicControls: [
      "Policy and routing rules",
      "Schema validation",
      "Retrieval before generation",
      "Human escalation for high-risk decisions",
    ],
    mvpWedge: "Route, enrich, and validate before generation",
    why: [
      "The workload is frequent and operations-heavy, so routing cost and human review matter as much as model choice.",
      "Deterministic controls are stronger than a single premium model for high-volume, structured support work.",
      "The recommended route narrows the model to the decision that actually adds value.",
    ],
  };

  const scenarioRows: ScenarioMetric[] = [
    {
      id: "baseline",
      label: "Baseline",
      summary: "Single advanced model for the entire workflow with full context and minimal filtering.",
      estimatedCostPerExecution: 0.095,
      dailyCost: 0.095 * (months / 30),
      monthlyCost: 0.095 * months,
      inputTokens: 48000,
      outputTokens: 6400,
      cachedTokens: 16000,
      modelCalls: 1,
      expectedLatency: "8-18s",
      premiumModelShare: 100,
      deterministicShare: 0,
      humanReviewRate: 12,
      budgetStatus: months > cleaned.monthlyBudget ? "At risk" : "Within budget",
      savingsVsBaseline: 0,
      keyCompromises: ["Higher cost per execution", "Lower control over token waste"],
      primaryRisks: ["Unbounded context", "Over-reliance on a premium model"],
      confidence: "Medium",
      assumptions: ["One advanced model handles all steps", "No deterministic controls before generation"],
    },
    {
      id: "economy",
      label: "Economy",
      summary: "Low-cost route that prioritizes deterministic filtering and smaller models wherever possible.",
      estimatedCostPerExecution: 0.032,
      dailyCost: 0.032 * (months / 30),
      monthlyCost: 0.032 * months,
      inputTokens: 30000,
      outputTokens: 4200,
      cachedTokens: 22000,
      modelCalls: 3,
      expectedLatency: "5-9s",
      premiumModelShare: 26,
      deterministicShare: 58,
      humanReviewRate: 15,
      budgetStatus: "Within budget",
      savingsVsBaseline: 66,
      keyCompromises: ["Fewer advanced reasoning steps", "More routing logic required"],
      primaryRisks: ["Edge cases may need escalation"],
      confidence: "Medium",
      assumptions: ["Most routing is deterministic", "Prompt compression is used selectively"],
    },
    {
      id: "balanced",
      label: "Balanced",
      summary: "Recommended mix of determinism, lower-cost models, schema validation, and human escalation without premium-model routing.",
      estimatedCostPerExecution: 0.049,
      dailyCost: 0.049 * (months / 30),
      monthlyCost: 0.049 * months,
      inputTokens: 34500,
      outputTokens: 5100,
      cachedTokens: 18500,
      modelCalls: 4,
      expectedLatency: "4-8s",
      premiumModelShare: 40,
      deterministicShare: 52,
      humanReviewRate: 13,
      budgetStatus: "Within budget",
      savingsVsBaseline: 49,
      keyCompromises: ["Requires governance around escalation", "Need careful cache policy"],
      primaryRisks: ["Moderate variation in edge-case handling"],
      confidence: "High",
      assumptions: ["Average policy complexity is moderate", "Human review is still required for a minority of exceptions"],
    },
    {
      id: "assurance",
      label: "Assurance",
      summary: "Higher-confidence route with more advanced validation, escalation, and human review where justified.",
      estimatedCostPerExecution: 0.071,
      dailyCost: 0.071 * (months / 30),
      monthlyCost: 0.071 * months,
      inputTokens: 39200,
      outputTokens: 6100,
      cachedTokens: 17000,
      modelCalls: 5,
      expectedLatency: "6-12s",
      premiumModelShare: 58,
      deterministicShare: 46,
      humanReviewRate: 18,
      budgetStatus: cleaned.monthlyBudget > 0 && 0.071 * months > cleaned.monthlyBudget ? "Needs budget review" : "Within budget",
      savingsVsBaseline: 25,
      keyCompromises: ["Higher cost than the balanced route", "More review effort for edge cases"],
      primaryRisks: ["Higher latency at peak concurrency"],
      confidence: "High",
      assumptions: ["The workflow requires stricter quality assurance and risk tolerance"],
    },
  ];

  const canonicalTraces = calculateScenarioTraces(tasks, cleaned);
  const tracedScenarios = scenarioRows.map((scenario) => {
    const trace = canonicalTraces[scenario.id];
    const pricedTasks = trace.tasks.filter((task) => task.provider !== "deterministic");
    const deterministicTasks = trace.tasks.filter((task) => task.provider === "deterministic");
    return {
      ...scenario,
      estimatedCostPerExecution: trace.costPerExecution ?? 0,
      dailyCost: trace.monthlyCost === null ? 0 : trace.monthlyCost / 30,
      monthlyCost: trace.monthlyCost ?? 0,
      inputTokens: trace.totalInputTokensPerExecution,
      cachedTokens: trace.totalCachedInputTokensPerExecution,
      outputTokens: trace.totalOutputTokensPerExecution,
      modelCalls: trace.expectedCallsPerExecution,
      savingsVsBaseline: trace.savingsVsBaseline ?? 0,
      premiumModelShare: Math.round((pricedTasks.filter((task) => task.model === "gpt-4.1").length / Math.max(1, pricedTasks.length)) * 100),
      deterministicShare: Math.round((deterministicTasks.length / Math.max(1, trace.tasks.length)) * 100),
      humanReviewRate: scenario.id === "economy" ? 22 : scenario.id === "assurance" ? 28 : scenario.id === "balanced" ? 18 : 10,
      budgetStatus: (trace.monthlyCost ?? 0) > cleaned.monthlyBudget ? "Needs budget review" : "Within budget",
      assumptions: [...scenario.assumptions, ...trace.assumptions],
      costTrace: {
        modelId: trace.tasks.find((task) => task.costPerExecution !== null)?.model ?? "mixed",
        inputPricePerMillion: trace.tasks.find((task) => task.inputPrice !== null)?.inputPrice ?? 0,
        cachedInputPricePerMillion: trace.tasks.find((task) => task.cachedInputPrice !== null)?.cachedInputPrice ?? 0,
        outputPricePerMillion: trace.tasks.find((task) => task.outputPrice !== null)?.outputPrice ?? 0,
        callsPerExecution: trace.expectedCallsPerExecution,
        retryRate: trace.tasks.reduce((sum, task) => sum + task.retryRate, 0) / Math.max(1, trace.tasks.length),
        fallbackRate: trace.tasks.reduce((sum, task) => sum + task.fallbackRate, 0) / Math.max(1, trace.tasks.length),
        monthlyExecutions: trace.monthlyExecutions,
        pricingStatus: trace.pricingStatus,
        currency: trace.currency,
        assumptions: trace.assumptions,
        tasks: trace.tasks,
      },
    };
  });
  const baselineMonthlyCost = tracedScenarios.find((scenario) => scenario.id === "baseline")?.monthlyCost ?? 0;
  const finalScenarios = tracedScenarios.map((scenario) => ({
    ...scenario,
    savingsVsBaseline: baselineMonthlyCost > 0 ? Number(((1 - scenario.monthlyCost / baselineMonthlyCost) * 100).toFixed(1)) : 0,
  }));

  const prompts: PromptPackItem[] = tasks.map((task) => {
    const originalPrompt = `Generate ${task.name.toLowerCase()} for this case without additional constraints.`;
    const taskGuidance: Record<string, string> = {
      Classification: "Allowed taxonomy: billing, access, product, delivery, policy, other. Return confidence and escalate below 0.80.",
      Extraction: "Return required fields, optional fields, evidence spans and null for missing values. Never invent values.",
      Retrieval: "Build the query, apply metadata filters, retrieve top-k=5, rerank, deduplicate and return source identifiers. No generation prompt is required.",
      Generation: "Use retrieved evidence only. Follow tone, maximum length, citation and unsupported-answer rules.",
      Validation: "Apply deterministic rules first. Return pass, needs_review or blocked with violation category and evidence.",
    };
    const optimisedPrompt = task.needsLLM
      ? `${taskGuidance[task.taskType] ?? "Use only supplied evidence."} Output compact JSON for ${task.name.toLowerCase()}. Escalate consequential or unsupported decisions.`
      : `${taskGuidance[task.taskType] ?? "Use deterministic controls."}`;
    const originalPromptTokens = getPromptTokenEstimate(originalPrompt);
    const optimisedPromptTokens = getPromptTokenEstimate(optimisedPrompt);
    const originalInputTokens = task.estimatedInputTokens;
    const contextReduction = task.estimatedInputTokens - Math.round(task.estimatedInputTokens * (task.contextRequirement === "High" ? 0.7 : task.contextRequirement === "Medium" ? 0.8 : 0.9));
    const optimisedInputTokens = Math.max(0, originalInputTokens - contextReduction + Math.max(0, optimisedPromptTokens - originalPromptTokens));
    const originalOutputTokens = task.estimatedOutputTokens;
    const optimisedOutputTokens = Math.max(40, Math.round(task.estimatedOutputTokens * (task.contextRequirement === "High" ? 0.85 : 0.9)));
    const originalExpectedAttempts = 1 + task.expectedRetryRate;
    const optimisedExpectedAttempts = 1 + Math.max(0, task.expectedRetryRate - 0.02);
    const originalExpectedTokens = (originalInputTokens + originalOutputTokens) * originalExpectedAttempts;
    const optimisedExpectedTokens = (optimisedInputTokens + optimisedOutputTokens) * optimisedExpectedAttempts;
    const tokenDifference = optimisedPromptTokens - originalPromptTokens;
    const netTokenDelta = optimisedExpectedTokens - originalExpectedTokens;
    const netTokenDeltaPercent = Number(((netTokenDelta / Math.max(1, originalExpectedTokens)) * 100).toFixed(1));
    const estimatedMonthlyTokenImpact = Math.round(netTokenDelta * cleaned.executionsPerMonth);
    return {
      id: task.id,
      taskName: task.name,
      systemInstruction: `You are evaluating ${task.taskType.toLowerCase()} work for a ${cleaned.industry || "enterprise"} workflow. Use only the provided evidence.`,
      taskPrompt: optimisedPrompt,
      expectedInputPlaceholders: ["customer_message", "policy_context", "account_metadata"],
      outputSchema: task.needsLLM ? '{ "status": "ok|needs_review|blocked", "confidence": 0, "result": "...", "evidence": [] }' : "Retrieval record: query, filters, ranked sources, deduplicated context.",
      contextInclusionStrategy: "Include only task-relevant policy excerpts, structured metadata, and the current interaction state.",
      contextExclusionStrategy: "Exclude duplicate history, full transcript noise, and irrelevant archives.",
      maxOutputGuidance: "Limit response length to the required schema and brief rationale tokens.",
      validationRules: ["Reject fabricated facts", "Require evidence when policy is ambiguous", "Escalate risky decisions"],
      retryGuidance: "Retry only when a schema or guardrail failure occurs.",
      fallbackCriteria: "Use the fallback model only when the original model fails schema validation or the task is high-risk.",
      humanEscalationCriteria: "Escalate when the decision could materially affect policy, billing, or customer safety.",
      originalPrompt,
      optimisedPrompt,
      changes: [task.needsLLM ? "Added task-specific contract" : "Made retrieval controls explicit", "Confined context to the task", "Added validation and escalation rules"],
      estimatedTokenDifference: `${Math.abs(netTokenDelta).toLocaleString("en-US")} ${netTokenDelta < 0 ? "fewer" : "more"} expected tokens per request`,
      riskIntroducedByCompression: netTokenDelta < 0 ? "Shorter expected request may omit nuance; validate against representative cases." : "Instruction investment adds safety and schema constraints; validate latency and adherence.",
      originalPromptTokens,
      optimisedPromptTokens,
      tokenDifference,
      percentageChange: Math.round((tokenDifference / Math.max(1, originalPromptTokens)) * 100),
      instructionInvestment: Math.max(0, tokenDifference),
      contextReduction,
      outputReduction: Math.max(0, 760 - task.estimatedOutputTokens),
      expectedRetryReduction: task.expectedRetryRate > 0.05 ? 0.05 : 0.02,
      netRequestImpact: netTokenDeltaPercent,
      originalInputTokens,
      optimisedInputTokens,
      originalOutputTokens,
      optimisedOutputTokens,
      estimatedMonthlyTokenImpact,
      estimatedMonthlyCostImpact: null,
      originalExpectedTokens,
      optimisedExpectedTokens,
      netTokenDelta,
      netTokenDeltaPercent,
      estimationMethod: "Characters divided by four, rounded up",
      validationRequired: "Golden cases, schema validation and human review for high-risk exceptions.",
    };
  });

  return {
    id: projectId,
    name: cleaned.projectName || "New BuildWise project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    demoMode: true,
    input: cleaned,
    spine,
    tasks,
    scenarios: finalScenarios,
    prompts,
    providerConfig: null,
    testRuns: [],
    calibration: { inputMultiplier: 1, outputMultiplier: 1, sampleCount: 0 },
    buildPaths: deriveBuildPaths(cleaned, tasks),
    recommendedBuildPath: cleaned.builderPreference === "low-code" ? "low-code" : cleaned.builderPreference === "architecture" ? "hybrid" : "pro-code",
  };
}

export function deriveBuildPaths(input: IntakeForm, tasks: WorkflowTask[]): BuildPathRecommendation[] {
  const highRisk = tasks.filter((task) => task.riskLevel === "High" || task.riskLevel === "Critical").length;
  const deterministic = tasks.filter((task) => !task.needsLLM).length;
  const lowCodeScore = Math.max(45, Math.min(92, 72 + deterministic * 5 - highRisk * 4 - (input.dataResidency ? 8 : 0)));
  const proCodeScore = Math.max(52, Math.min(95, 76 + (input.externalProviders ? 5 : 0) + highRisk * 3 + (input.qualitySensitivity === "critical" ? 6 : 0)));
  const hybridScore = Math.max(58, Math.min(96, Math.round((lowCodeScore + proCodeScore) / 2) + (input.humanReview ? 4 : 0)));
  return [
    { id: "low-code", label: "Low-code", fitScore: lowCodeScore, summary: "Fastest path for governed workflows that can stay inside approved connectors and deterministic controls.", strengths: ["Shorter time to pilot", "Business-owner visibility", "Strong connector reuse"], tradeoffs: ["Less control over custom retrieval and evaluation", "Platform limits may surface at scale"], ownership: ["Operations owns rules and review queues", "Platform team owns connectors and environments"] },
    { id: "pro-code", label: "Pro-code", fitScore: proCodeScore, summary: "Best path when custom retrieval, evaluation, privacy, or integration control is the primary constraint.", strengths: ["Maximum control over routing and observability", "Easier custom evaluation and provider abstraction", "Better fit for regulated or high-risk logic"], tradeoffs: ["Higher engineering investment", "Longer initial delivery runway"], ownership: ["Engineering owns runtime and evaluation", "Product and risk owners approve policy gates"] },
    { id: "hybrid", label: "Hybrid", fitScore: hybridScore, summary: "Combines low-code operational surfaces with pro-code intelligence services and policy controls.", strengths: ["Balances speed and control", "Clear separation of workflow and intelligence", "Supports progressive hardening"], tradeoffs: ["Requires explicit interface ownership", "Two delivery toolchains to govern"], ownership: ["Operations owns orchestration surfaces", "Engineering owns intelligence and integration contracts"] },
  ];
}

export function buildDemoProject(): Project {
  const project = buildProjectFromForm(getDefaultProjectInput(), "demo-support-project");
  return {
    ...project,
    demoMode: true,
    name: "Enterprise customer-support optimisation",
  };
}

export function recalculateProjectFromTasks(project: Project, tasks: WorkflowTask[]): Project {
  const rebuilt = buildProjectFromForm(project.input, project.id);
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    tasks,
    scenarios: rebuilt.scenarios,
    prompts: rebuilt.prompts.map((prompt) => {
      const task = tasks.find((item) => item.id === prompt.id);
      return task ? { ...prompt, taskName: task.name } : prompt;
    }),
  };
}

export function getProjectNavigationSections(): Array<{ id: string; label: string; href: string }> {
  return [
    { id: "spine", label: "Workload spine", href: "spine" },
    { id: "suitability", label: "AI suitability", href: "suitability" },
    { id: "build-path", label: "Build path", href: "build-path" },
    { id: "workflow", label: "Workflow", href: "workflow" },
    { id: "scenarios", label: "Scenarios", href: "scenarios" },
    { id: "prompts", label: "Prompts", href: "prompts" },
    { id: "test", label: "Controlled test", href: "test" },
    { id: "build-kit", label: "Build kit", href: "build-kit" },
    { id: "blueprint", label: "Blueprint", href: "blueprint" },
  ];
}

export function redactSecrets(value: string | undefined): string {
  if (!value) return "Not configured";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

export function providerSupportsLocalHost(provider: ProviderConfig): boolean {
  return provider.kind === "ollama" || provider.kind === "openai-compatible" || provider.kind === "nvidia";
}

export function getRecommendationText(project: Project): string {
  return `Recommended route: ${project.scenarios[2]?.label ?? "Balanced"} — a cost-aware mix of deterministic controls and selective model usage.`;
}
