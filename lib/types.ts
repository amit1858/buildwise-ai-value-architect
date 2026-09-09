export type BuilderType = "low-code" | "pro-code";

export interface BuildwiseInput {
  problem: string;
  persona: string;
  goal: string;
  constraints: string;
  builderType: BuilderType;
}

export interface DecisionSpineOutput {
  productType: string;
  complexity: string;
  mvpWedge: string;
  constraints: string[];
  recommendedModules: string[];
  personaType: string;
  builderType: BuilderType;
}

export interface ModuleOutput {
  title: string;
  summary: string;
  keyDecision: string;
  reasoning: string;
  tradeoffs: string[];
  risks: string[];
  nextSteps: string[];
  details?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionItem {
  label: string;
  type: "text" | "list" | "prompt" | "code";
  content: string | string[];
}

export interface ExecutionStrategy {
  builderType: BuilderType;
  executionMode: string;
  summary: string;
  outputs: ExecutionItem[];
  nextSteps: string[];
}

export interface ResponseMetadata {
  generatedAt: string;
  version: string;
  mode: "mock" | "live";
  modulesGenerated: number;
  builderType: BuilderType;
}

export interface GenerateResponse {
  input: BuildwiseInput;
  decisionSpine: DecisionSpineOutput;
  modules: Record<string, ModuleOutput>;
  executionStrategy: ExecutionStrategy | null;
  metadata: ResponseMetadata;
}

export interface ApiError {
  error: string;
  detail?: string;
}
