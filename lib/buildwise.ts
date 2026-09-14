import { z } from "zod";
import { NVIDIA_BUILD_DEFAULT_MODEL } from "@/lib/model-registry";

export type QualitySensitivity = "standard" | "high" | "critical";
export type WorkloadMode = "batch" | "real-time" | "mixed";
export type WorkloadUnit = "tokens" | "words" | "pages" | "characters";
export type BuilderPreference = "pro-code" | "low-code" | "architecture";
export type ProjectKind = "blank" | "draft" | "demo" | "generated" | "imported";
export type SuitabilityClass = "generative-ai" | "selected-stages" | "deterministic" | "not-ready";
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
  typicalInputValue: z.coerce.number().min(0).default(0),
  typicalInputUnit: z.enum(["tokens", "words", "pages", "characters"]).default("words"),
  highInputValue: z.coerce.number().min(0).default(0),
  highInputUnit: z.enum(["tokens", "words", "pages", "characters"]).default("words"),
  typicalOutputValue: z.coerce.number().min(0).default(0),
  typicalOutputUnit: z.enum(["tokens", "words", "pages", "characters"]).default("words"),
  typicalInputSize: z.string().default(""),
  typicalOutputSize: z.string().default(""),
  attachedDocuments: z.coerce.number().min(0).default(2),
  averageAttachmentPages: z.coerce.number().min(0).default(0),
  averageConversationTurns: z.coerce.number().min(0).default(0),
  retrievedPassages: z.coerce.number().min(0).default(0),
  tokensPerPassage: z.coerce.number().min(0).default(0),
  cachedContextPercent: z.coerce.number().min(0).max(100).default(0),
  peakVolumeMultiplier: z.coerce.number().min(1).default(1),
  conversationHistory: z.boolean().default(false),
  peakConcurrency: z.coerce.number().min(1).default(10),
  workloadMode: z.enum(["batch", "real-time", "mixed"]).default("mixed"),
  qualitySensitivity: z.enum(["standard", "high", "critical"]).default("high"),
  latencyTarget: z.string().default("< 3 seconds"),
  targetResponseSeconds: z.coerce.number().min(0).default(0),
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
  kind?: ProjectKind;
  schemaVersion?: number;
  suitability?: { classification: SuitabilityClass; label: string; rationale: string[] };
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
    typicalInputValue: 900,
    typicalInputUnit: "words",
    highInputValue: 2200,
    highInputUnit: "words",
    typicalOutputValue: 250,
    typicalOutputUnit: "words",
    typicalInputSize: "2-8 pages of customer and policy context",
    typicalOutputSize: "150-350 words",
    attachedDocuments: 3,
    averageAttachmentPages: 4,
    averageConversationTurns: 6,
    retrievedPassages: 5,
    tokensPerPassage: 260,
    cachedContextPercent: 30,
    peakVolumeMultiplier: 1.8,
    conversationHistory: true,
    peakConcurrency: 35,
    workloadMode: "mixed" as const,
    qualitySensitivity: "high" as const,
    latencyTarget: "under 4 seconds",
    targetResponseSeconds: 4,
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
    typicalInputValue: 6000,
    typicalInputUnit: "tokens",
    highInputValue: 24000,
    highInputUnit: "tokens",
    typicalOutputValue: 850,
    typicalOutputUnit: "words",
    typicalInputSize: "1-3 documents and CRM notes",
    typicalOutputSize: "600-1100 words",
    attachedDocuments: 5,
    averageAttachmentPages: 8,
    averageConversationTurns: 0,
    retrievedPassages: 12,
    tokensPerPassage: 420,
    cachedContextPercent: 20,
    peakVolumeMultiplier: 1.4,
    conversationHistory: false,
    peakConcurrency: 12,
    workloadMode: "batch" as const,
    qualitySensitivity: "high" as const,
    latencyTarget: "under 20 seconds",
    targetResponseSeconds: 20,
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
    typicalInputValue: 25,
    typicalInputUnit: "pages",
    highInputValue: 60,
    highInputUnit: "pages",
    typicalOutputValue: 2,
    typicalOutputUnit: "pages",
    typicalInputSize: "10-40 pages of legal text",
    typicalOutputSize: "1-3 page summary with exceptions",
    attachedDocuments: 6,
    averageAttachmentPages: 25,
    averageConversationTurns: 0,
    retrievedPassages: 8,
    tokensPerPassage: 400,
    cachedContextPercent: 15,
    peakVolumeMultiplier: 1.3,
    conversationHistory: false,
    peakConcurrency: 8,
    workloadMode: "batch" as const,
    qualitySensitivity: "critical" as const,
    latencyTarget: "under 30 seconds",
    targetResponseSeconds: 30,
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
  return getBlankProjectInput();
}

export function getBlankProjectInput(): IntakeForm {
  return {
    projectName: "",
    problemStatement: "",
    targetUsers: "",
    businessOutcome: "",
    industry: "",
    currentProcess: "",
    processCost: 0,
    expectedValue: 0,
    executionsPerMonth: 0,
    typicalInputValue: 0,
    typicalInputUnit: "words",
    highInputValue: 0,
    highInputUnit: "words",
    typicalOutputValue: 0,
    typicalOutputUnit: "words",
    typicalInputSize: "",
    typicalOutputSize: "",
    attachedDocuments: 0,
    averageAttachmentPages: 0,
    averageConversationTurns: 0,
    retrievedPassages: 0,
    tokensPerPassage: 0,
    cachedContextPercent: 0,
    peakVolumeMultiplier: 1,
    conversationHistory: false,
    peakConcurrency: 1,
    workloadMode: "mixed",
    qualitySensitivity: "standard",
    latencyTarget: "",
    targetResponseSeconds: 0,
    monthlyBudget: 0,
    dataSensitivity: "internal",
    dataResidency: false,
    humanReview: false,
    externalProviders: false,
    localModels: false,
    approvedProviders: [],
    structuredOutput: false,
    citations: false,
    builderPreference: "architecture",
    sampleInput: "",
    confidentialWarning: true,
  };
}

export function getDemoProjectInput(): IntakeForm {
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
    typicalInputValue: 900,
    typicalInputUnit: "words",
    highInputValue: 2200,
    highInputUnit: "words",
    typicalOutputValue: 250,
    typicalOutputUnit: "words",
    typicalInputSize: "2-8 pages of customer and policy context",
    typicalOutputSize: "150-350 words",
    attachedDocuments: 3,
    averageAttachmentPages: 4,
    averageConversationTurns: 6,
    retrievedPassages: 5,
    tokensPerPassage: 260,
    cachedContextPercent: 30,
    peakVolumeMultiplier: 1.8,
    conversationHistory: true,
    peakConcurrency: 35,
    workloadMode: "mixed",
    qualitySensitivity: "high",
    latencyTarget: "under 4 seconds",
    targetResponseSeconds: 4,
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

export function getRoutingPatchForModel(task: WorkflowTask, modelId: string): Partial<WorkflowTask> {
  const deterministic = modelId === "Deterministic retrieval" || modelId === "Deterministic execution";
  if (deterministic) {
    return {
      needsLLM: false,
      primaryProvider: "deterministic",
      primaryModel: modelId,
      fallbackProvider: "deterministic",
      fallbackModel: "Human review",
      expectedCallsPerExecution: 0,
      expectedRetryRate: 0,
      recommendedExecutionMethod: modelId === "Deterministic retrieval"
        ? "Deterministic retrieval with explicit evidence rules — no model call"
        : "Deterministic rules or calculation — no model call",
    };
  }
  const model = getModelById(modelId);
  if (!model) return {};
  return {
    needsLLM: true,
    primaryProvider: model.provider,
    primaryModel: model.modelId,
    expectedCallsPerExecution: Math.max(1, task.expectedCallsPerExecution),
    recommendedExecutionMethod: task.needsLLM
      ? task.recommendedExecutionMethod
      : "Selective model assistance with schema validation",
  };
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
  const deterministic = !task.needsLLM;
  const calls = (factor: number) => deterministic ? 0 : Math.max(0, Number((task.expectedCallsPerExecution * factor).toFixed(3)));
  const retries = (factor: number) => deterministic ? 0 : Math.min(1, Number((task.expectedRetryRate * factor).toFixed(4)));
  if (scenarioId === "baseline") {
    return {
      ...task,
      primaryModel: deterministic ? "Deterministic execution" : task.primaryModel,
      estimatedInputTokens: Math.round(task.estimatedInputTokens * 1.8),
      estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 1.4),
      expectedCallsPerExecution: calls(1.15),
      expectedRetryRate: retries(1.25),
      cacheHitRate: task.cacheEligible ? Math.min(task.cacheHitRate, 0.1) : 0,
      recommendedExecutionMethod: deterministic ? task.recommendedExecutionMethod : "Edited primary route with broad baseline context",
    };
  }
  if (scenarioId === "economy") {
    return {
      ...task,
      primaryModel: deterministic ? "Deterministic execution" : task.primaryModel,
      estimatedInputTokens: Math.round(task.estimatedInputTokens * 0.7),
      estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 0.65),
      expectedCallsPerExecution: calls(0.85),
      expectedRetryRate: retries(0.75),
      cacheHitRate: task.cacheEligible ? Math.max(task.cacheHitRate, 0.65) : 0,
      recommendedExecutionMethod: deterministic ? "Deterministic rules and retrieval" : "Small-context execution using the edited model route",
    };
  }
  if (scenarioId === "assurance") {
    return {
      ...task,
      primaryModel: deterministic ? "Deterministic execution" : task.primaryModel,
      estimatedInputTokens: Math.round(task.estimatedInputTokens * 1.35),
      estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 1.2),
      expectedCallsPerExecution: calls(task.taskType === "Validation" ? 1.35 : 1.15),
      expectedRetryRate: retries(1.5),
      cacheHitRate: task.cacheEligible ? Math.min(task.cacheHitRate, 0.25) : 0,
      recommendedExecutionMethod: deterministic ? "Deterministic execution with evidence gate" : "Edited model route with assurance validation and human escalation",
    };
  }
  return {
    ...task,
    primaryModel: deterministic ? "Deterministic execution" : task.primaryModel,
    estimatedInputTokens: Math.round(task.estimatedInputTokens * 0.85),
    estimatedOutputTokens: Math.round(task.estimatedOutputTokens * 0.8),
    expectedCallsPerExecution: calls(1),
    expectedRetryRate: retries(1),
    cacheHitRate: task.cacheEligible ? Math.max(task.cacheHitRate, 0.5) : 0,
    recommendedExecutionMethod: deterministic ? "Deterministic routing and filtered retrieval" : "Selective execution using the edited model route",
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
  const input = getDemoProjectInput();
  return calculateCostTrace(makeWorkflowTasks(input), input, "balanced").monthlyCost ?? 0;
}

export function convertWorkloadToTokens(value: number, unit: WorkloadUnit): number {
  const factors: Record<WorkloadUnit, number> = { tokens: 1, words: 1.33, pages: 500, characters: 0.25 };
  return Math.round(Math.max(0, value) * factors[unit]);
}

type TaskSeed = [string, string, string, boolean, string, string];
type GeneralWorkflowIntent = "agreement-review" | "record-summarisation" | "resource-optimisation" | "content-production" | "evidence-analysis";

function classifyDomain(input: IntakeForm) {
  const text = `${input.projectName} ${input.problemStatement} ${input.industry} ${input.sampleInput}`.toLowerCase();
  if (/(payroll|tax calculation|withholding)/.test(text)) return "payroll";
  if (/(adverse.event|pharma|pharmacovigilance|reportability)/.test(text)) return "pharma";
  if (/(invoice|accounts.payable|ocr|purchase order)/.test(text)) return "invoice";
  if (/(maintenance|sensor|equipment|industrial|technician)/.test(text)) return "maintenance";
  if (/(account research|buying signal|sales research|stakeholder)/.test(text)) return "research";
  if (/(support|customer service|ticket|contact centre)/.test(text)) return "support";
  return "general";
}

function inferGeneralWorkflowIntent(input: IntakeForm): GeneralWorkflowIntent {
  const text = `${input.projectName} ${input.problemStatement} ${input.businessOutcome} ${input.currentProcess} ${input.sampleInput}`.toLowerCase();
  if (/(contract|agreement|clause|obligation|terms|redline|legal review|policy comparison)/.test(text)) return "agreement-review";
  if (/(clinical note|medical record|patient chart|encounter note|case note|progress note|summari[sz]e.*record|record.*summari[sz])/.test(text)) return "record-summarisation";
  if (/(schedule|roster|allocation|assign|capacity plan|shift|timetable|resource constraint|availability)/.test(text)) return "resource-optimisation";
  if (/(campaign|marketing|content|creative|copy|brand|publish|channel variant)/.test(text)) return "content-production";
  return "evidence-analysis";
}

function generalTaskSeeds(input: IntakeForm): TaskSeed[] {
  const subject = input.problemStatement || input.projectName || "the submitted work item";
  const intent = inferGeneralWorkflowIntent(input);
  if (intent === "agreement-review") {
    return [
      ["agreement-ingest", "Agreement structure and party extraction", "Extraction", true, "Extract parties, dates, definitions, clauses, and referenced schedules into a traceable structure.", "Legal review is required for unreadable or ambiguous language."],
      ["clause-inventory", "Clause and obligation inventory", "Validation", false, "Map extracted clauses, obligations, dates, and missing provisions using versioned rules.", "Missing or conflicting obligations block completion."],
      ["playbook-retrieval", "Approved playbook and precedent retrieval", "Retrieval", false, "Retrieve applicable negotiation positions, approved clauses, and jurisdiction-specific guidance.", "Only current approved legal sources may be used."],
      ["deviation-analysis", "Contract deviation and risk analysis", "Generation", true, "Compare agreement language with retrieved positions and explain material deviations with clause citations.", "The model cannot make a binding legal determination."],
      ["legal-approval", "Legal decision and redline approval gate", "Routing", false, "Route cited deviations and proposed actions to the accountable legal reviewer.", "An authorised legal reviewer owns every acceptance or redline decision."],
    ];
  }
  if (intent === "record-summarisation") {
    return [
      ["record-normalize", "Source-record normalization", "Extraction", true, "Extract dated observations, actions, measurements, and attributed statements without inventing missing facts.", "Low-confidence or conflicting source text requires reviewer inspection."],
      ["timeline-assemble", "Chronology and provenance assembly", "Calculation", false, "Order extracted events deterministically and preserve source locations and authorship.", "Conflicting timestamps remain explicit rather than inferred."],
      ["terminology-check", "Terminology and identifier validation", "Validation", false, "Validate controlled terms, identifiers, units, and required note sections.", "Invalid identifiers or units block the summary."],
      ["record-summary", "Longitudinal record summarisation", "Generation", true, "Summarise the validated chronology with source attribution and no diagnosis or unsupported conclusion.", "A qualified domain reviewer approves the summary before use."],
      ["review-signoff", "Qualified-reviewer sign-off", "Routing", false, "Route the source-linked summary and unresolved conflicts to the accountable reviewer.", "The generated summary cannot replace professional judgement."],
    ];
  }
  if (intent === "resource-optimisation") {
    return [
      ["demand-input", "Demand and availability intake", "Extraction", false, `Normalize demand, availability, and constraints for ${input.projectName}.`, "Review missing availability or demand."],
      ["constraint-check", "Constraint and eligibility validation", "Validation", false, "Apply hard constraints, eligibility rules, and conflicts deterministically.", "Block infeasible assignments."],
      ["schedule-optimize", "Schedule and allocation optimization", "Calculation", false, "Use a deterministic optimization solver with explicit objectives.", "Human owner approves exceptions and objective trade-offs."],
      ["exception-explain", "Optimization exception explanation", "Generation", true, "Explain solver results and unresolved conflicts without changing assignments.", "Explanations cannot override solver constraints."],
      ["publish-gate", "Allocation approval and publish gate", "Validation", false, "Require approval and version the published allocation.", "Only an authorised owner may publish."],
    ];
  }
  if (intent === "content-production") {
    return [
      ["brief-check", "Content brief validation", "Validation", false, `Validate objectives, audience, channels, and claims for ${input.projectName}.`, "Incomplete or prohibited claims block drafting."],
      ["audience-evidence", "Audience and source evidence retrieval", "Retrieval", false, "Retrieve approved facts, audience research, and brand rules.", "Stale or unapproved evidence cannot be used."],
      ["content-draft", "Channel-specific content drafting", "Generation", true, "Draft channel variants from the approved brief and evidence.", "Human owner reviews every publishable draft."],
      ["publication-check", "Claim, policy, and format validation", "Validation", false, "Apply deterministic claim, disclosure, phrase, and channel checks.", "Failed checks block publication."],
      ["content-approval", "Content approval handoff", "Routing", false, "Route variants to accountable channel and policy owners.", "No autonomous publication."],
    ];
  }
  const seeds: TaskSeed[] = [
    ["request-normalize", "Request and evidence normalization", "Routing", false, `Validate the requested analysis, evidence boundaries, and output obligations for ${subject}.`, "Escalate incomplete or high-risk requests."],
  ];
  if (input.attachedDocuments > 0) seeds.push(["source-extract", "Source-document fact extraction", "Extraction", true, "Extract traceable project facts from supplied sources.", "Review unreadable, conflicting, or low-confidence fields."]);
  if (input.citations || input.retrievedPassages > 0) seeds.push(["evidence-retrieve", "Authoritative evidence retrieval", "Retrieval", false, "Retrieve approved, relevant, and traceable sources.", "Block unsupported conclusions."]);
  seeds.push(["evidence-synthesis", "Evidence-grounded analysis", "Generation", true, "Synthesize the requested analysis from validated evidence without expanding the decision scope.", "Human approval is required for consequential outcomes."]);
  if (input.structuredOutput) seeds.push(["result-validate", "Result schema and claim validation", "Validation", false, "Apply output-schema, citation, risk, and completeness rules.", "Reject invalid, unsupported, or incomplete output."]);
  seeds.push(["decision-route", "Accountable decision routing", "Routing", false, "Route the validated result and exceptions to the accountable owner.", input.humanReview ? "Human approval is mandatory." : "Human review is required for exceptions."]);
  return seeds;
}

function domainTaskSeeds(domain: ReturnType<typeof classifyDomain>, input: IntakeForm): TaskSeed[] {
  if (domain === "general") return generalTaskSeeds(input);
  const profiles: Record<string, TaskSeed[]> = {
    support: [
      ["intake-route", "Contact routing", "Routing", false, "Route metadata and explicit priority rules.", "Escalate safety, legal, and policy exceptions."],
      ["fact-extraction", "Case fact extraction", "Extraction", true, "Extract issue facts into a strict schema.", "Review low-confidence or incomplete fields."],
      ["policy-retrieval", "Policy evidence retrieval", "Retrieval", false, "Retrieve and rank approved policy sources.", "Require source identifiers for every policy claim."],
      ["response-draft", "Grounded response drafting", "Generation", true, "Draft from extracted facts and retrieved evidence only.", "Review high-risk or customer-impacting responses."],
      ["response-validation", "Response and escalation validation", "Validation", false, "Apply policy, privacy, and escalation rules.", "Block failed checks and route to a specialist."],
    ],
    pharma: [
      ["case-intake", "Adverse-event case intake", "Extraction", true, "Extract reporter, patient, product, event, and dates without inferring missing facts.", "Mandatory pharmacovigilance specialist review."],
      ["completeness", "Minimum-criteria completeness check", "Validation", false, "Apply deterministic minimum-case criteria and duplicate checks.", "Mandatory specialist gate for incomplete or ambiguous cases."],
      ["evidence", "Label and procedure evidence retrieval", "Retrieval", false, "Retrieve controlled labels, SOPs, and source citations.", "Citations required; stale or absent sources block progression."],
      ["narrative", "Source-grounded case narrative", "Generation", true, "Summarise reported facts without deciding regulatory reportability.", "Mandatory specialist approval before use."],
      ["reportability-gate", "Reportability decision gate", "Validation", false, "Reserve reportability and submission decisions for authorised specialists.", "No autonomous reportability decision."],
    ],
    invoice: [
      ["document-capture", "Invoice OCR and field extraction", "Extraction", true, "Extract supplier, totals, tax, dates, and line items with confidence.", "Review unreadable or low-confidence documents."],
      ["master-data", "Supplier and purchase-order match", "Validation", false, "Match approved supplier, PO, receipt, and bank data deterministically.", "Block unmatched or changed payment details."],
      ["arithmetic", "Totals and tax validation", "Calculation", false, "Recalculate totals, tax, currency, and tolerances using rules.", "Route exceptions to accounts payable."],
      ["exception-summary", "Exception explanation", "Generation", true, "Explain deterministic validation failures using supplied evidence.", "Human approval for payment exceptions."],
      ["approval-route", "Approval routing", "Routing", false, "Apply amount, cost-centre, segregation, and authority rules.", "Never release payment without required approvals."],
    ],
    maintenance: [
      ["signal-check", "Sensor and event validation", "Validation", false, "Validate timestamps, ranges, missing signals, and alarm codes.", "Unsafe or corrupt telemetry blocks automated advice."],
      ["history-retrieval", "Maintenance history retrieval", "Retrieval", false, "Retrieve equipment manuals, work orders, and recent failure history.", "Require asset-specific sources and freshness."],
      ["diagnosis", "Candidate diagnosis synthesis", "Generation", true, "Rank possible causes from validated signals and maintenance evidence.", "Human technician approval is mandatory."],
      ["safety-gate", "Safety and lockout gate", "Validation", false, "Apply safety, lockout, operating-envelope, and escalation rules.", "Block any recommendation that conflicts with safety controls."],
      ["work-order", "Technician work-order draft", "Generation", true, "Draft checks and parts for technician review, not autonomous action.", "Technician approves every recommended intervention."],
    ],
    research: [
      ["source-plan", "Research source plan", "Routing", false, "Select approved internal and external sources with freshness windows.", "Exclude disallowed or stale sources."],
      ["account-retrieval", "Account evidence retrieval", "Retrieval", false, "Retrieve CRM, filings, news, and product evidence with timestamps.", "Every material claim requires a citation and freshness date."],
      ["entity-resolution", "Entity and stakeholder resolution", "Validation", false, "Resolve organisations and people deterministically where possible.", "Review ambiguous entity matches."],
      ["synthesis", "Cited account synthesis", "Generation", true, "Synthesize buying signals, risks, initiatives, and gaps from cited evidence.", "Human review before outreach or account decisions."],
      ["freshness-check", "Citation and freshness validation", "Validation", false, "Reject uncited, contradictory, or stale claims.", "Block publication when freshness requirements fail."],
    ],
    payroll: [
      ["input-validation", "Payroll input validation", "Validation", false, "Validate jurisdiction, period, earnings, status, and required fields.", "Missing statutory inputs block calculation."],
      ["rule-selection", "Effective tax-rule selection", "Retrieval", false, "Select versioned rules by jurisdiction and effective date.", "Only approved, dated rule sets may execute."],
      ["tax-calculation", "Payroll tax calculation", "Calculation", false, "Execute deterministic statutory formulas with rounding and caps.", "LLMs must not calculate withholding or liability."],
      ["reconciliation", "Calculation reconciliation", "Validation", false, "Recompute totals and compare against payroll controls.", "Material variances require payroll specialist review."],
      ["explanation", "Employee-facing explanation", "Generation", true, "Optionally explain completed deterministic results without changing them.", "Human-approved templates and no calculation authority."],
    ],
  };
  return profiles[domain];
}

function makeWorkflowTasks(input: IntakeForm): WorkflowTask[] {
  const domain = classifyDomain(input);
  const typicalTokens = Math.max(120, convertWorkloadToTokens(input.typicalInputValue, input.typicalInputUnit));
  const highTokens = Math.max(typicalTokens, convertWorkloadToTokens(input.highInputValue, input.highInputUnit));
  const outputTokens = Math.max(60, convertWorkloadToTokens(input.typicalOutputValue, input.typicalOutputUnit));
  const retrievedTokens = input.retrievedPassages * input.tokensPerPassage;
  const attachmentTokens = input.attachedDocuments * input.averageAttachmentPages * 700;
  const conversationTokens = Math.max(0, input.averageConversationTurns - 1) * Math.round(typicalTokens * 0.35);
  const normalContextTokens = typicalTokens + attachmentTokens + conversationTokens;
  const peakContextTokens = highTokens + attachmentTokens + conversationTokens;
  const capacityRetryPressure =
    Math.max(0, input.peakVolumeMultiplier - 1) * 0.02 +
    Math.max(0, input.peakConcurrency - 1) * 0.001 +
    (input.targetResponseSeconds <= 5 ? 0.02 : input.targetResponseSeconds <= 15 ? 0.01 : 0);
  const critical = input.qualitySensitivity === "critical" || input.dataSensitivity === "regulated";
  return domainTaskSeeds(domain, input).map(([id, name, taskType, needsLLM, purpose, review], index) => {
    const retrieval = taskType === "Retrieval";
    const generation = taskType === "Generation";
    const deterministic = !needsLLM;
    const estimatedInputTokens = deterministic ? Math.max(80, Math.round(normalContextTokens * 0.25)) : Math.round((index % 2 ? peakContextTokens : normalContextTokens) + (retrieval || generation ? retrievedTokens : 0));
    const attachmentBatches = taskType === "Extraction" ? Math.max(1, Math.ceil(input.attachedDocuments / 5)) : 1;
    const turnCalls = generation ? 1 + Math.max(0, input.averageConversationTurns - 1) * 0.25 : 1;
    return {
      id,
      name,
      purpose,
      taskType,
      inputDescription: `${input.sampleInput || input.problemStatement} ${retrieval ? "Approved source corpus and metadata." : ""}`.trim(),
      outputDescription: deterministic ? "Versioned decision record with evidence and rule outcomes." : "Schema-constrained result with confidence and evidence.",
      complexity: critical || generation ? "High" : taskType === "Extraction" ? "Medium" : "Low",
      contextRequirement: retrieval || generation ? "High" : "Medium",
      qualityRequirement: critical ? "Critical" : input.qualitySensitivity === "high" ? "High" : "Standard",
      riskLevel: critical || /safety|reportability|tax|payment/.test(`${name} ${purpose}`.toLowerCase()) ? "High" : "Medium",
      needsLLM,
      recommendedExecutionMethod: deterministic ? "Deterministic rules, retrieval, or calculation — no model call" : "Selective model assistance with schema validation",
      primaryProvider: deterministic ? "deterministic" : "azure-openai",
      primaryModel: deterministic ? (retrieval ? "Deterministic retrieval" : "Deterministic execution") : generation && critical ? "gpt-4.1" : "gpt-4.1-mini",
      fallbackProvider: deterministic ? "deterministic" : "openai",
      fallbackModel: deterministic ? "Human review" : "gpt-4o-mini",
      promptStrategy: deterministic ? purpose : `${purpose} Use only supplied evidence; return compact structured output.`,
      estimatedInputTokens,
      estimatedOutputTokens: deterministic ? 0 : Math.max(80, Math.round(outputTokens * (generation ? 1 : 0.45))),
      expectedCallsPerExecution: deterministic ? 0 : Number((attachmentBatches * turnCalls).toFixed(2)),
      expectedRetryRate: deterministic ? 0 : Math.min(0.5, Number(((critical ? 0.08 : 0.04) + capacityRetryPressure).toFixed(4))),
      cacheEligible: Boolean(retrievedTokens) || input.cachedContextPercent > 0,
      cacheHitRate: Math.min(0.9, input.cachedContextPercent / 100),
      humanReviewPolicy: review,
      explanation: deterministic ? "This task is more reliable and auditable as versioned deterministic execution." : "Model assistance is limited to an evidence-grounded language or extraction task.",
    };
  });
}

export function buildProjectFromForm(form: IntakeForm, projectId = `project-${Date.now()}`): Project {
  const cleaned = intakeSchema.parse(form);
  const months = Math.max(1, cleaned.executionsPerMonth || 1000);
  const tasks = makeWorkflowTasks(cleaned);
  const domain = classifyDomain(cleaned);
  const domainLabels: Record<typeof domain, string> = {
    support: "Customer-support operations",
    pharma: "Regulated adverse-event intake",
    invoice: "Accounts-payable document processing",
    maintenance: "Safety-aware industrial maintenance",
    research: "Citation-grounded account research",
    payroll: "Deterministic payroll tax calculation",
    general: "General enterprise workflow",
  };
  const deterministicCount = tasks.filter((task) => !task.needsLLM).length;
  const suitability: NonNullable<Project["suitability"]> = domain === "payroll"
    ? { classification: "deterministic", label: "Primarily deterministic automation", rationale: ["Statutory calculations require versioned rules and exact arithmetic.", "Language-model use is limited to optional explanation after calculation."] }
    : !cleaned.sampleInput || !cleaned.businessOutcome
      ? { classification: "not-ready", label: "Not currently suitable without better data or controls", rationale: ["A representative sample and measurable outcome are required before model-assisted design."] }
      : deterministicCount >= Math.ceil(tasks.length * 0.6)
        ? { classification: "selected-stages", label: "Suitable only for selected workflow stages", rationale: ["Most stages have stronger deterministic controls.", "Model assistance is reserved for bounded extraction, synthesis, or explanation."] }
        : { classification: "generative-ai", label: "Suitable for generative AI with controls", rationale: ["The workflow contains evidence-grounded language tasks.", "Deterministic validation and human escalation remain required."] };

  const spine: WorkloadSpine = {
    workloadCategory: domainLabels[domain],
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
    deterministicControls: Array.from(new Set(tasks.filter((task) => !task.needsLLM).map((task) => task.name).concat(["Schema validation", "Explicit human escalation"]))),
    mvpWedge: `${tasks[0]?.name ?? "Validate inputs"} before ${tasks.find((task) => task.needsLLM)?.name ?? "deterministic execution"}`,
    why: [
      suitability.label,
      `${deterministicCount} of ${tasks.length} workflow stages are deterministic and are not billed model calls.`,
      `Capacity basis: ${cleaned.executionsPerMonth.toLocaleString()} monthly executions × ${cleaned.peakVolumeMultiplier} peak multiplier at ${cleaned.peakConcurrency} concurrent requests, with a ${cleaned.targetResponseSeconds}s response target.`,
      `Context basis: ${cleaned.attachedDocuments} attachments × ${cleaned.averageAttachmentPages} pages, ${cleaned.averageConversationTurns} conversation turns, and ${cleaned.cachedContextPercent}% reusable context.`,
      cleaned.humanReview ? "The supplied governance posture requires an explicit human approval boundary." : "Human review remains an exception path for unsupported or high-risk outcomes.",
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
    const originalPrompt = `Complete ${task.name.toLowerCase()} for ${cleaned.problemStatement}.`;
    const taskGuidance: Record<string, string> = {
      Classification: "Use the project-defined taxonomy. Return confidence and escalate below the approved threshold.",
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
      systemInstruction: `You are performing ${task.taskType.toLowerCase()} for ${cleaned.projectName} in ${cleaned.industry || "an enterprise workflow"}. Use only the provided evidence.`,
      taskPrompt: optimisedPrompt,
      expectedInputPlaceholders: ["workflow_input", "authoritative_evidence", "structured_metadata"],
      outputSchema: task.needsLLM ? '{ "status": "ok|needs_review|blocked", "confidence": 0, "result": "...", "evidence": [] }' : "Retrieval record: query, filters, ranked sources, deduplicated context.",
      contextInclusionStrategy: "Include only task-relevant policy excerpts, structured metadata, and the current interaction state.",
      contextExclusionStrategy: "Exclude duplicate history, full transcript noise, and irrelevant archives.",
      maxOutputGuidance: "Limit response length to the required schema and brief rationale tokens.",
      validationRules: ["Reject fabricated facts", "Require evidence when policy is ambiguous", "Escalate risky decisions"],
      retryGuidance: "Retry only when a schema or guardrail failure occurs.",
      fallbackCriteria: "Use the fallback model only when the original model fails schema validation or the task is high-risk.",
      humanEscalationCriteria: task.humanReviewPolicy,
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
    demoMode: projectId === "demo-support-project",
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
    kind: projectId === "demo-support-project" ? "demo" : "generated",
    schemaVersion: 2,
    suitability,
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
  const project = buildProjectFromForm(getDemoProjectInput(), "demo-support-project");
  return {
    ...project,
    demoMode: true,
    name: "Enterprise customer-support optimisation",
  };
}

export function recalculateProjectFromTasks(project: Project, tasks: WorkflowTask[]): Project {
  const rebuilt = buildProjectFromForm(project.input, project.id);
  const traces = calculateScenarioTraces(tasks, project.input);
  const scenarios = rebuilt.scenarios.map((scenario) => {
    const trace = traces[scenario.id];
    return {
      ...scenario,
      monthlyCost: trace.monthlyCost ?? 0,
      dailyCost: (trace.monthlyCost ?? 0) / 30,
      estimatedCostPerExecution: trace.costPerExecution ?? 0,
      inputTokens: trace.totalInputTokensPerExecution,
      cachedTokens: trace.totalCachedInputTokensPerExecution,
      outputTokens: trace.totalOutputTokensPerExecution,
      modelCalls: trace.expectedCallsPerExecution,
      savingsVsBaseline: trace.savingsVsBaseline ?? 0,
      costTrace: { ...scenario.costTrace!, tasks: trace.tasks, monthlyExecutions: trace.monthlyExecutions, callsPerExecution: trace.expectedCallsPerExecution },
    };
  });
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    tasks,
    scenarios,
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
