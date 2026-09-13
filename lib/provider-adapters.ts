import type { ExecutionProvenance, ModelProfile, ProviderConfig, ProviderKind } from "@/lib/buildwise";
import { getModelById, modelCatalogue } from "@/lib/buildwise";
import { NVIDIA_BUILD_BASE_URL, NVIDIA_BUILD_CHAT_COMPLETIONS_URL, NVIDIA_BUILD_CHAT_ROUTE, NVIDIA_BUILD_DEFAULT_MODEL } from "@/lib/model-registry";

export interface ProviderValidationResult {
  ok: boolean;
  status: "Not configured" | "Incomplete" | "Ready to validate" | "Validating" | "Connected" | "Connection failed" | "Local endpoint unavailable";
  message: string;
  detectedModel?: string;
  sanitizedEndpoint?: string;
  providerId?: string;
}

export interface ProviderExecutionRequest {
  taskName?: string;
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  structuredOutput?: boolean;
  mode?: "live" | "mock";
}

export interface ProviderExecutionResult {
  providerId: string;
  model: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  latencyMs: number;
  finishReason: string;
  actualCost: number | null;
  projectedMonthlyCost: number | null;
  pricingSource: string;
  provenance: ExecutionProvenance;
  isStructuredValid: boolean;
  warnings: string[];
  status: "success" | "error";
  usageSummary: string;
  usageReported: boolean;
  requestId?: string;
}

export interface ProviderAdapter {
  kind: ProviderKind;
  validate(provider: ProviderConfig): Promise<ProviderValidationResult>;
  execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult>;
}

const PROVIDER_API_KEY_PATTERNS = [/sk-[A-Za-z0-9_-]+/gi, /AIza[A-Za-z0-9_-]+/gi, /gh[pousr]_[A-Za-z0-9_]+/gi, /Bearer\s+[A-Za-z0-9._-]+/gi, /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/gi, /api[_-]?key[=:]?["']?([A-Za-z0-9._~-]+)/gi];

export function sanitizeProviderError(value: unknown): string {
  const text = value instanceof Error ? value.message : String(value ?? "");
  let cleaned = text;
  for (const pattern of PROVIDER_API_KEY_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[REDACTED]");
  }
  return cleaned || "Provider request failed.";
}

function buildSafeEndpoint(endpoint?: string) {
  if (!endpoint) return "Not configured";
  try {
    const url = new URL(endpoint);
    const host = url.hostname;
    const pathname = url.pathname.length > 1 ? url.pathname : "";
    return `${url.protocol}//${host}${pathname.length > 0 ? pathname.slice(0, 32) : ""}`;
  } catch {
    return endpoint.replace(/(api[_-]?key=)([^&]+)/gi, "$1[REDACTED]");
  }
}

function getNormalizedProviderModel(provider: ProviderConfig): string {
  return provider.selectedModel || provider.model || provider.deployment || "default";
}

function endpointWithPath(endpoint: string | undefined, path: string): string {
  const base = (endpoint || "").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getNvidiaBuildBaseEndpoint(endpoint?: string): string {
  const raw = (endpoint || NVIDIA_BUILD_BASE_URL).trim().replace(/\/+$/, "");
  return raw === "https://integrate.api.nvidia.com" ? NVIDIA_BUILD_BASE_URL : raw;
}

export function getNvidiaChatCompletionsUrl(endpoint?: string): string {
  const base = getNvidiaBuildBaseEndpoint(endpoint);
  return base === NVIDIA_BUILD_BASE_URL ? NVIDIA_BUILD_CHAT_COMPLETIONS_URL : endpointWithPath(base, NVIDIA_BUILD_CHAT_ROUTE);
}

function getNvidiaModelsUrl(endpoint?: string): string {
  return endpointWithPath(getNvidiaBuildBaseEndpoint(endpoint), "/models");
}

async function requestJson(url: string, init: RequestInit, timeoutMs = 15_000): Promise<{ payload: Record<string, unknown>; latencyMs: number }> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let payload: Record<string, unknown> = {};
    if (text) {
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        payload = { raw: text };
      }
    }
    if (!response.ok) {
      throw new Error(`Provider returned HTTP ${response.status}: ${String(payload.error ?? payload.message ?? "request failed")}`);
    }
    return { payload, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

function parseStructuredContent(content: string, required: boolean): boolean {
  if (!required) return true;
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function mockExecution(provider: ProviderConfig, request: ProviderExecutionRequest): ProviderExecutionResult {
  const model = getNormalizedProviderModel(provider);
  const content = request.structuredOutput
    ? JSON.stringify({ status: "ok", result: `Mocked response for ${request.taskName ?? "controlled test"}`, reasons: ["Contract-accurate mock"] })
    : `Mocked response for ${request.taskName ?? "controlled test"}.`;
  const usage = { input: 4200, output: 620, cached: 1500 };
  const actualCost = calculateNormalizedCost(model, usage);
  return {
    providerId: provider.id,
    model,
    content,
    inputTokens: usage.input,
    outputTokens: usage.output,
    cachedTokens: usage.cached,
    latencyMs: 42,
    finishReason: "stop",
    actualCost,
    projectedMonthlyCost: actualCost === null ? null : actualCost * 100_000,
    pricingSource: actualCost === null ? "Pricing unavailable" : "Demo catalogue pricing",
    provenance: "mock-adapter",
    isStructuredValid: parseStructuredContent(content, Boolean(request.structuredOutput)),
    warnings: ["Mocked provider response. No paid provider call was made."],
    status: "success",
    usageSummary: `${usage.input} input / ${usage.output} output / ${usage.cached} cached tokens`,
    usageReported: true,
  };
}

function openAiResult(provider: ProviderConfig, request: ProviderExecutionRequest, payload: Record<string, unknown>, latencyMs: number): ProviderExecutionResult {
  const extracted = extractAssessedContent(payload);
  const usage = normalizeUsageUsage(payload);
  const model = String(payload.model ?? getNormalizedProviderModel(provider));
  const priceConfigured = Boolean(getModelPrice(model));
  const actualCost = usage.reported ? calculateNormalizedCost(model, usage) : null;
  return {
    providerId: provider.id,
    model,
    content: extracted.content,
    inputTokens: usage.input,
    outputTokens: usage.output,
    cachedTokens: usage.cached,
    latencyMs,
    finishReason: extracted.finishReason,
    actualCost,
    projectedMonthlyCost: actualCost === null ? null : actualCost * 100_000,
    pricingSource: actualCost === null ? "Provider usage unavailable" : priceConfigured ? "Demo catalogue pricing" : "Pricing unavailable",
    provenance: "live-provider",
    isStructuredValid: parseStructuredContent(extracted.content, Boolean(request.structuredOutput)) && extracted.structuredValid,
    warnings: usage.reported && priceConfigured ? [] : [usage.reported ? "Provider returned a model without a configured price; cost is unavailable until pricing is added." : "Provider did not report token usage; usage and call cost are unavailable."],
    status: "success",
    usageSummary: usage.reported ? `${usage.input} input / ${usage.output} output / ${usage.cached} cached tokens` : "Provider did not report token usage.",
    usageReported: usage.reported,
    requestId: typeof payload.id === "string" ? sanitizeProviderError(payload.id) : undefined,
  };
}

function openAiHeaders(provider: ProviderConfig): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: provider.apiKey ? "Bearer " + provider.apiKey : "",
  };
}

function getModelPrice(modelId: string): ModelProfile | undefined {
  return getModelById(modelId) ?? modelCatalogue.find((entry) => entry.modelId === modelId || entry.displayName.toLowerCase() === modelId.toLowerCase());
}

function normalizeUsageUsage(data: Record<string, unknown>): { input: number; output: number; cached: number; reported: boolean } {
  const usage = data.usage as Record<string, unknown> | undefined;
  if (!usage) return { input: 0, output: 0, cached: 0, reported: false };
  const promptRaw = usage.prompt_tokens as number | string | undefined;
  const completionRaw = usage.completion_tokens as number | string | undefined;
  const cacheReadRaw = usage.cache_read_input_tokens as number | string | undefined;
  const cacheCreationRaw = usage.cache_creation_input_tokens as number | string | undefined;
  const promptTokens = Number(promptRaw ?? 0);
  const completionTokens = Number(completionRaw ?? 0);
  const cacheReadTokens = Number(cacheReadRaw ?? 0);
  const cacheCreationTokens = Number(cacheCreationRaw ?? 0);
  return {
    input: Number.isFinite(promptTokens) ? promptTokens : 0,
    output: Number.isFinite(completionTokens) ? completionTokens : 0,
    cached: Number.isFinite(cacheReadTokens) ? cacheReadTokens + cacheCreationTokens : 0,
    reported: promptRaw !== undefined || completionRaw !== undefined || cacheReadRaw !== undefined || cacheCreationRaw !== undefined,
  };
}

function calculateNormalizedCost(modelId: string, usage: { input: number; output: number; cached: number }): number | null {
  const model = getModelPrice(modelId);
  if (!model) return null;
  const inputCost = (usage.input / 1_000_000) * (model.inputPricePerMillion ?? 0);
  const cachedCost = (usage.cached / 1_000_000) * (model.cachedInputPricePerMillion ?? 0);
  const outputCost = (usage.output / 1_000_000) * (model.outputPricePerMillion ?? 0);
  return inputCost + cachedCost + outputCost;
}

function extractAssessedContent(payload: Record<string, unknown>): { content: string; finishReason: string; structuredValid: boolean } {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const firstChoice = choices[0] as Record<string, unknown> | undefined;
  const message = (firstChoice?.message as Record<string, unknown> | undefined) ?? {};
  const contentText = typeof message.content === "string"
    ? message.content
    : Array.isArray(message.content)
      ? message.content.map((part) => typeof part === "object" && part && "text" in part ? String((part as Record<string, unknown>).text ?? "") : "").join(" ")
      : "";
  const finishReason = String((firstChoice?.finish_reason as string | undefined) ?? "stop");
  const hasStructuredFlag = typeof (payload as Record<string, unknown>).structured_output === "boolean"
    ? Boolean((payload as Record<string, unknown>).structured_output)
    : true;
  return { content: contentText, finishReason, structuredValid: hasStructuredFlag };
}

export function getCredentialStorageWarning() {
  return "Not retained after refresh. Keys are kept in browser memory only for the active session.";
}

export function canRunControlledTest({
  provider,
  requiresUserConfirmation,
}: {
  provider?: ProviderConfig | null;
  requiresUserConfirmation: boolean;
}) {
  if (!provider) return false;
  if (provider.status !== "Connected") return false;
  if (requiresUserConfirmation === false) return false;
  return true;
}

export function evaluateUsageVariance({
  estimatedInputTokens,
  actualInputTokens,
  estimatedOutputTokens,
  actualOutputTokens,
}: {
  estimatedInputTokens: number;
  actualInputTokens: number;
  estimatedOutputTokens: number;
  actualOutputTokens: number;
}) {
  return {
    inputVariance: ((actualInputTokens - estimatedInputTokens) / Math.max(1, estimatedInputTokens)) * 100,
    outputVariance: ((actualOutputTokens - estimatedOutputTokens) / Math.max(1, estimatedOutputTokens)) * 100,
  };
}

class BaseAdapter implements ProviderAdapter {
  kind: ProviderKind;

  constructor(kind: ProviderKind) {
    this.kind = kind;
  }

  async validate(provider: ProviderConfig): Promise<ProviderValidationResult> {
    const endpoint = provider.endpoint?.trim();
    if (!endpoint) {
      return { ok: false, status: "Incomplete", message: "Enter an endpoint before validating." };
    }
    if (provider.requiresKey && !provider.apiKey?.trim()) {
      return { ok: false, status: "Incomplete", message: "API key is required for this provider." };
    }
    return { ok: true, status: "Ready to validate", message: "Ready to validate.", providerId: provider.id };
  }

  async execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    return mockExecution(provider, request);
  }
}

class AzureOpenAIAdapter extends BaseAdapter {
  constructor() { super("azure-openai"); }

  override async validate(provider: ProviderConfig): Promise<ProviderValidationResult> {
    const endpoint = provider.endpoint?.trim();
    if (!endpoint || !provider.deployment) {
      return { ok: false, status: "Incomplete", message: "Provide an Azure endpoint and deployment name." };
    }
    if (!provider.apiKey) {
      return { ok: false, status: "Incomplete", message: "Azure OpenAI requires an API key." };
    }
    const sanitizedEndpoint = buildSafeEndpoint(endpoint);
    const result = await requestJson(`${endpointWithPath(endpoint, "/openai/deployments")}?api-version=${encodeURIComponent(provider.apiVersion || "2024-10-21")}`, { method: "GET", headers: { "api-key": provider.apiKey } });
    const deployments = Array.isArray(result.payload.data) ? result.payload.data as Array<Record<string, unknown>> : [];
    return { ok: true, status: "Connected", message: "Azure OpenAI connection validated.", detectedModel: provider.deployment || String(deployments[0]?.model ?? "gpt-4.1-mini"), sanitizedEndpoint, providerId: provider.id };
  }

  override async execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (request.mode === "mock") return mockExecution(provider, request);
    const endpoint = provider.endpoint?.trim();
    const deployment = provider.deployment || provider.model;
    if (!endpoint || !deployment || !provider.apiKey) throw new Error("Azure OpenAI endpoint, deployment, and API key are required.");
    const url = `${endpointWithPath(endpoint, `/openai/deployments/${encodeURIComponent(deployment)}/chat/completions`)}?api-version=${encodeURIComponent(provider.apiVersion || "2024-10-21")}`;
    const result = await requestJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": provider.apiKey },
      body: JSON.stringify({
        messages: [{ role: "system", content: request.systemPrompt ?? "" }, { role: "user", content: request.prompt }],
        max_tokens: request.maxOutputTokens ?? 800,
        temperature: request.temperature ?? 0,
      }),
    });
    return openAiResult(provider, request, result.payload, result.latencyMs);
  }
}

class OpenAIAdapter extends BaseAdapter {
  constructor() { super("openai"); }

  override async validate(provider: ProviderConfig): Promise<ProviderValidationResult> {
    if (!provider.apiKey) return { ok: false, status: "Incomplete", message: "OpenAI requires an API key." };
    const endpoint = provider.endpoint || "https://api.openai.com/v1";
    const result = await requestJson(endpointWithPath(endpoint, "/models"), { method: "GET", headers: openAiHeaders(provider) });
    const models = Array.isArray(result.payload.data) ? result.payload.data as Array<Record<string, unknown>> : [];
    const detectedModel = provider.model || String(models[0]?.id ?? "gpt-4o-mini");
    return { ok: true, status: "Connected", message: "OpenAI connection validated.", detectedModel, sanitizedEndpoint: buildSafeEndpoint(endpoint), providerId: provider.id };
  }

  override async execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (request.mode === "mock") return mockExecution(provider, request);
    const endpoint = provider.endpoint || "https://api.openai.com/v1";
    const model = request.model || provider.model || "gpt-4o-mini";
    const result = await requestJson(endpointWithPath(endpoint, "/chat/completions"), {
      method: "POST",
      headers: openAiHeaders(provider),
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: request.systemPrompt ?? "" }, { role: "user", content: request.prompt }],
        max_tokens: request.maxOutputTokens ?? 800,
        temperature: request.temperature ?? 0,
      }),
    });
    return openAiResult(provider, request, result.payload, result.latencyMs);
  }
}

class AnthropicAdapter extends BaseAdapter {
  constructor() { super("anthropic"); }

  override async validate(provider: ProviderConfig): Promise<ProviderValidationResult> {
    if (!provider.apiKey) return { ok: false, status: "Incomplete", message: "Anthropic requires an API key." };
    const endpoint = provider.endpoint || "https://api.anthropic.com/v1";
    const result = await requestJson(endpointWithPath(endpoint, "/models"), { method: "GET", headers: { "x-api-key": provider.apiKey, "anthropic-version": provider.apiVersion || "2023-06-01" } });
    const models = Array.isArray(result.payload.data) ? result.payload.data as Array<Record<string, unknown>> : [];
    return { ok: true, status: "Connected", message: "Anthropic connection validated.", detectedModel: provider.model || String(models[0]?.id ?? "claude-3-5-haiku"), sanitizedEndpoint: buildSafeEndpoint(endpoint), providerId: provider.id };
  }

  override async execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (request.mode === "mock") return mockExecution(provider, request);
    const endpoint = provider.endpoint || "https://api.anthropic.com/v1";
    const model = request.model || provider.model || "claude-3-5-haiku";
    const result = await requestJson(endpointWithPath(endpoint, "/messages"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": provider.apiKey ?? "", "anthropic-version": provider.apiVersion || "2023-06-01" },
      body: JSON.stringify({
        model,
        system: request.systemPrompt ?? "",
        messages: [{ role: "user", content: request.prompt }],
        max_tokens: request.maxOutputTokens ?? 800,
        temperature: request.temperature ?? 0,
      }),
    });
    const content = Array.isArray(result.payload.content) ? result.payload.content.map((part) => typeof part === "object" && part ? String((part as Record<string, unknown>).text ?? "") : "").join("") : "";
    const usagePayload = (result.payload.usage ?? {}) as Record<string, unknown>;
    const usage = { input: Number(usagePayload.input_tokens ?? 0), output: Number(usagePayload.output_tokens ?? 0), cached: Number(usagePayload.cache_read_input_tokens ?? 0) };
    const resolvedModel = String(result.payload.model ?? model);
    const actualCost = calculateNormalizedCost(resolvedModel, usage);
    return { providerId: provider.id, model: resolvedModel, content, inputTokens: usage.input, outputTokens: usage.output, cachedTokens: usage.cached, latencyMs: result.latencyMs, finishReason: String(result.payload.stop_reason ?? "end_turn"), actualCost, projectedMonthlyCost: actualCost === null ? null : actualCost * 100_000, pricingSource: actualCost === null ? "Pricing unavailable" : "Demo catalogue pricing", provenance: "live-provider", isStructuredValid: parseStructuredContent(content, Boolean(request.structuredOutput)), warnings: actualCost === null ? ["Call cost unavailable because pricing is not configured."] : [], status: "success", usageSummary: `${usage.input} input / ${usage.output} output / ${usage.cached} cached tokens`, usageReported: true };
  }
}

class NvidiaAdapter extends BaseAdapter {
  constructor() { super("nvidia"); }

  override async validate(provider: ProviderConfig): Promise<ProviderValidationResult> {
    const endpoint = provider.endpoint?.trim();
    if (!endpoint) return { ok: false, status: "Incomplete", message: "Provide an NVIDIA / NIM endpoint." };
    if (!provider.apiKey) return { ok: false, status: "Incomplete", message: "NVIDIA / NIM requires an API key." };
    try {
      const result = await requestJson(getNvidiaModelsUrl(endpoint), { method: "GET", headers: openAiHeaders(provider) });
      const models = Array.isArray(result.payload.data) ? result.payload.data as Array<Record<string, unknown>> : [];
      const selectedModel = provider.selectedModel || provider.model || NVIDIA_BUILD_DEFAULT_MODEL;
      const modelIds = models.map((model) => String(model.id ?? ""));
      return { ok: true, status: "Connected", message: "NVIDIA Build endpoint validated.", detectedModel: modelIds.includes(selectedModel) ? selectedModel : String(models[0]?.id ?? NVIDIA_BUILD_DEFAULT_MODEL), sanitizedEndpoint: buildSafeEndpoint(getNvidiaBuildBaseEndpoint(endpoint)), providerId: provider.id };
    } catch {
      return { ok: false, status: "Connection failed", message: "NVIDIA Build validation failed. Confirm the selected model works in NVIDIA Build Playground, then retry with the same model.", detectedModel: provider.selectedModel || provider.model || NVIDIA_BUILD_DEFAULT_MODEL, sanitizedEndpoint: buildSafeEndpoint(getNvidiaBuildBaseEndpoint(endpoint)), providerId: provider.id };
    }
  }

  override async execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (request.mode === "mock") return mockExecution(provider, request);
    const endpoint = provider.endpoint?.trim();
    const model = request.model || provider.selectedModel || provider.model || NVIDIA_BUILD_DEFAULT_MODEL;
    const profile = getModelPrice(model);
    if (!endpoint || !provider.apiKey) throw new Error("NVIDIA endpoint and API key are required.");
    try {
      const result = await requestJson(getNvidiaChatCompletionsUrl(endpoint), {
        method: "POST",
        headers: openAiHeaders(provider),
        body: JSON.stringify({ model, messages: [{ role: "system", content: request.systemPrompt ?? "" }, { role: "user", content: request.prompt }], max_tokens: request.maxOutputTokens ?? 800, temperature: request.temperature ?? profile?.recommendedTemperature ?? 1, top_p: request.topP ?? profile?.recommendedTopP, stream: false }),
      });
      return openAiResult(provider, request, result.payload, result.latencyMs);
    } catch {
      throw new Error("NVIDIA Build request failed. No provider key, authorization header, or raw upstream error was exposed.");
    }
  }
}

class OpenAICompatibleAdapter extends BaseAdapter {
  constructor() { super("openai-compatible"); }

  override async validate(provider: ProviderConfig): Promise<ProviderValidationResult> {
    const endpoint = provider.endpoint?.trim();
    if (!endpoint) return { ok: false, status: "Incomplete", message: "Provide a compatible endpoint." };
    if (provider.requiresKey && !provider.apiKey) return { ok: false, status: "Incomplete", message: "This compatible endpoint requires an API key." };
    const result = await requestJson(endpointWithPath(endpoint, "/models"), { method: "GET", headers: provider.apiKey ? openAiHeaders(provider) : { "Content-Type": "application/json" } });
    const models = Array.isArray(result.payload.data) ? result.payload.data as Array<Record<string, unknown>> : [];
    return { ok: true, status: "Connected", message: "OpenAI-compatible endpoint validated.", detectedModel: provider.model || String(models[0]?.id ?? "custom-model"), sanitizedEndpoint: buildSafeEndpoint(endpoint), providerId: provider.id };
  }

  override async execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (request.mode === "mock") return mockExecution(provider, request);
    const endpoint = provider.endpoint?.trim();
    const model = request.model || provider.model || "custom-model";
    if (!endpoint) throw new Error("OpenAI-compatible endpoint is required.");
    const result = await requestJson(endpointWithPath(endpoint, "/chat/completions"), { method: "POST", headers: provider.apiKey ? openAiHeaders(provider) : { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "system", content: request.systemPrompt ?? "" }, { role: "user", content: request.prompt }], max_tokens: request.maxOutputTokens ?? 800, temperature: request.temperature ?? 0 }) });
    return openAiResult(provider, request, result.payload, result.latencyMs);
  }
}

class OllamaAdapter extends BaseAdapter {
  constructor() { super("ollama"); }

  override async validate(provider: ProviderConfig): Promise<ProviderValidationResult> {
    const endpoint = provider.endpoint?.trim();
    if (!endpoint) return { ok: false, status: "Incomplete", message: "Provide the local Ollama endpoint." };
    if (!endpoint.includes("localhost") && !endpoint.includes("127.0.0.1") && !endpoint.includes("0.0.0.0")) {
      return { ok: false, status: "Local endpoint unavailable", message: "Local Ollama must target a local endpoint." };
    }
    const result = await requestJson(endpointWithPath(endpoint, "/api/tags"), { method: "GET" });
    const models = Array.isArray(result.payload.models) ? result.payload.models as Array<Record<string, unknown>> : [];
    return { ok: true, status: "Connected", message: "Local endpoint is available.", detectedModel: provider.model || String(models[0]?.name ?? "llama3.1:8b"), sanitizedEndpoint: buildSafeEndpoint(endpoint), providerId: provider.id };
  }

  override async execute(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
    if (request.mode === "mock") return mockExecution(provider, request);
    const endpoint = provider.endpoint?.trim();
    const model = request.model || provider.model || "llama3.1:8b";
    if (!endpoint) throw new Error("Ollama endpoint is required.");
    const result = await requestJson(endpointWithPath(endpoint, "/api/generate"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, prompt: `${request.systemPrompt ?? ""}\n${request.prompt}`, stream: false, options: { temperature: request.temperature ?? 0 } }) });
    const usage = { input: Number(result.payload.prompt_eval_count ?? 0), output: Number(result.payload.eval_count ?? 0), cached: 0 };
    const content = String(result.payload.response ?? "");
    const actualCost = calculateNormalizedCost(model, usage);
    return { providerId: provider.id, model, content, inputTokens: usage.input, outputTokens: usage.output, cachedTokens: 0, latencyMs: result.latencyMs, finishReason: String(result.payload.done_reason ?? "stop"), actualCost, projectedMonthlyCost: actualCost === null ? null : actualCost * 100_000, pricingSource: actualCost === null ? "Pricing unavailable" : "Demo catalogue pricing", provenance: "live-provider", isStructuredValid: parseStructuredContent(content, Boolean(request.structuredOutput)), warnings: actualCost === null ? ["Call cost unavailable because pricing is not configured."] : [], status: "success", usageSummary: `${usage.input} input / ${usage.output} output / 0 cached tokens`, usageReported: true };
  }
}

export function getProviderAdapter(provider: ProviderConfig): ProviderAdapter {
  const kind = provider.kind;
  if (kind === "azure-openai") return new AzureOpenAIAdapter();
  if (kind === "openai") return new OpenAIAdapter();
  if (kind === "anthropic") return new AnthropicAdapter();
  if (kind === "nvidia") return new NvidiaAdapter();
  if (kind === "openai-compatible") return new OpenAICompatibleAdapter();
  if (kind === "ollama") return new OllamaAdapter();
  return new BaseAdapter(kind);
}

export async function validateProviderConfiguration(provider: ProviderConfig): Promise<ProviderValidationResult> {
  const adapter = getProviderAdapter(provider);
  return adapter.validate(provider);
}

export async function executeProviderTest(provider: ProviderConfig, request: ProviderExecutionRequest): Promise<ProviderExecutionResult> {
  const adapter = getProviderAdapter(provider);
  return adapter.execute(provider, request);
}
