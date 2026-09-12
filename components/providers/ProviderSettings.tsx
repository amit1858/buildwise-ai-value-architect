"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { modelCatalogue, type OperatingMode, type ProviderConfig, redactSecrets } from "@/lib/buildwise";
import { NVIDIA_BUILD_DEFAULT_MODEL } from "@/lib/model-registry";
import {
  clearCustomModelIdentifier,
  CUSTOM_MODEL_VALUE,
  getCustomModelIdentifier,
  getProviderValidationModel,
  getSelectedCatalogueModel,
  isCustomModelSelection,
  selectProviderModel,
  setCustomModelIdentifier,
} from "@/lib/provider-model-selection";
import {
  clearAllSessionProviderSecrets,
  getSessionProviderSecret,
  readSessionProviderSettings,
  setSessionProviderSecret,
  writeSessionProviderSettings,
} from "@/lib/provider-session";

const initialProviders: ProviderConfig[] = [
  {
    id: "azure-openai",
    kind: "azure-openai",
    displayName: "Azure OpenAI",
    endpoint: "https://example-resource.openai.azure.com",
    apiKey: "",
    deployment: "gpt-4.1-mini",
    apiVersion: "2024-10-21",
    region: "eastus",
    requiresKey: true,
    keyLabel: "API key",
    status: "Not configured",
  },
  {
    id: "openai",
    kind: "openai",
    displayName: "OpenAI",
    apiKey: "",
    model: "gpt-4o-mini",
    requiresKey: true,
    keyLabel: "API key",
    status: "Not configured",
  },
  {
    id: "anthropic",
    kind: "anthropic",
    displayName: "Anthropic",
    apiKey: "",
    model: "claude-3-5-haiku",
    requiresKey: true,
    keyLabel: "API key",
    status: "Not configured",
  },
  {
    id: "nvidia",
    kind: "nvidia",
    displayName: "NVIDIA / NIM",
    endpoint: "https://integrate.api.nvidia.com/v1",
    apiKey: "",
    model: NVIDIA_BUILD_DEFAULT_MODEL,
    requiresKey: true,
    keyLabel: "API key",
    status: "Not configured",
  },
  {
    id: "openai-compatible",
    kind: "openai-compatible",
    displayName: "OpenAI-compatible",
    endpoint: "https://gateway.example.com/v1",
    apiKey: "",
    model: "custom-model",
    requiresKey: true,
    keyLabel: "API key",
    status: "Not configured",
  },
  {
    id: "ollama",
    kind: "ollama",
    displayName: "Local Ollama",
    endpoint: "http://localhost:11434",
    model: "llama3.1:8b",
    requiresKey: false,
    keyLabel: "No key required",
    status: "Not configured",
  },
];

export function ProviderSettings({ publicDemo = false }: { publicDemo?: boolean }) {
  const isPublicShowcase = publicDemo || process.env.NEXT_PUBLIC_BUILDWISE_PUBLIC_DEMO === "true";
  const standaloneUrl = process.env.NEXT_PUBLIC_BUILDWISE_STANDALONE_URL;
  const [providers, setProviders] = useState<ProviderConfig[]>(() => {
    const partial = readSessionProviderSettings();
    if (partial.length === 0) return initialProviders;
    return initialProviders.map((provider) => {
      const stored = partial.find((item) => item.id === provider.id);
      return stored ? { ...provider, ...stored, apiKey: getSessionProviderSecret(provider.id) } : provider;
    });
  });
  const [selectedProviderId, setSelectedProviderId] = useState<string>("openai");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [workingMode, setWorkingMode] = useState<OperatingMode>(publicDemo ? "demo" : "demo");
  const [busyProviderId, setBusyProviderId] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState("");

  useEffect(() => {
    writeSessionProviderSettings(providers.map((provider) => ({ ...provider, apiKey: "" })));
  }, [providers]);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) ?? providers[0],
    [providers, selectedProviderId]
  );

  const updateProvider = <K extends keyof ProviderConfig>(id: string, key: K, value: ProviderConfig[K]) => {
    if (key === "apiKey") setSessionProviderSecret(id, String(value ?? ""));
    setProviders((current) => current.map((provider) => (provider.id === id ? { ...provider, [key]: value } : provider)));
  };

  const validateProvider = async (provider: ProviderConfig) => {
    const selectedModel = getProviderValidationModel(provider);
    if (isPublicShowcase) {
      updateProvider(provider.id, "status", "Not configured");
      updateProvider(provider.id, "validationMessage", "Public showcase mode blocks provider credentials and live validation. Open the standalone application for BYOK testing.");
      return;
    }
    if (!selectedModel) {
      updateProvider(provider.id, "status", "Incomplete");
      updateProvider(provider.id, "validationMessage", "Select a catalogue model or enter a custom model identifier before validation.");
      return;
    }
    setBusyProviderId(provider.id);
    updateProvider(provider.id, "status", "Validating");
    try {
      const response = await fetch("/api/providers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: { ...provider, apiKey: provider.apiKey ?? "" } }),
      });
      const data = (await response.json()) as { ok?: boolean; status?: ProviderConfig["status"]; message?: string; detectedModel?: string; sanitizedEndpoint?: string };
      const nextStatus = data.status ?? (data.ok ? "Connected" : "Connection failed");
      const nextModel = data.detectedModel || provider.selectedModel || provider.model || provider.deployment;
      updateProvider(provider.id, "status", nextStatus);
      updateProvider(provider.id, "selectedModel", nextModel);
      if (provider.isCustomModel) updateProvider(provider.id, "customModel", nextModel);
      updateProvider(provider.id, "sanitizedEndpoint", data.sanitizedEndpoint ?? provider.endpoint ?? "");
      updateProvider(provider.id, "validationMessage", data.message ?? "");
      updateProvider(provider.id, "lastValidatedAt", new Date().toISOString());
      if (data.ok) {
        updateProvider(provider.id, "isEnabledForSession", true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation request failed.";
      updateProvider(provider.id, "status", "Connection failed");
      updateProvider(provider.id, "validationMessage", message.replace(/sk-[A-Za-z0-9_-]+/gi, "[REDACTED]"));
    } finally {
      setBusyProviderId(null);
    }
  };

  const clearProvider = (providerId: string) => {
    setSessionProviderSecret(providerId, "");
    setProviders((current) => current.map((provider) => {
      if (provider.id !== providerId) return provider;
      const cleared = clearCustomModelIdentifier(provider);
      return {
        ...cleared,
        apiKey: "",
        status: "Not configured",
        validationMessage: "Not retained after refresh.",
        isEnabledForSession: false,
        sanitizedEndpoint: "",
        lastValidatedAt: undefined,
      };
    }));
  };

  const forgetAllKeys = () => {
    setProviders((current) => current.map((provider) => ({ ...provider, apiKey: "", isEnabledForSession: false, status: "Not configured", validationMessage: "Not retained after refresh.", lastValidatedAt: undefined, selectedModel: provider.selectedModel || provider.model || provider.deployment || "" })));
    clearAllSessionProviderSecrets();
  };

  const connectedCount = providers.filter((provider) => provider.status === "Connected" && provider.isEnabledForSession).length;

  return (
    <main id="main-content" className="bw-page min-h-[100dvh] px-6 py-8 text-stone-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between border-b border-stone-300 pb-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">BuildWise</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Provider settings</h1>
          </div>
          <Link href="/" className="text-sm text-stone-700 underline-offset-2 hover:underline">Back to home</Link>
        </header>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Operating mode</div>
              <div className="mt-3 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
                {(["demo", "live-byok"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={isPublicShowcase && mode === "live-byok"}
                    onClick={() => setWorkingMode(mode)}
                    className={workingMode === mode ? "rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white" : "rounded-full px-4 py-2 text-sm font-medium text-stone-600"}
                  >
                    {mode === "demo" ? "Demo" : "Live BYOK"}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
              <span className="font-medium text-stone-900">Connected providers:</span> {connectedCount}
            </div>
          </div>

          <div className="mt-4 text-sm text-stone-600">
            {isPublicShowcase
            ? "GitHub Pages is a credential-free public demo. Provider keys cannot be entered, validated, or used here. Live BYOK is available only in the server-hosted BuildWise application."
            : workingMode === "demo"
            ? "Demo mode remains fully functional without provider credentials. Live BYOK becomes available only after at least one provider validates successfully."
              : connectedCount === 0
                ? "Live BYOK is unavailable until a provider is successfully validated."
                : "Live BYOK is active for the current session and no provider secret is retained after refresh."}
          </div>
          {standaloneUrl && <a href={standaloneUrl} className="mt-4 inline-flex rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white">Open standalone application</a>}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            {providers.map((provider) => {
              const isSelected = selectedProviderId === provider.id;
              const status = provider.status ?? "Not configured";
              return (
                <div key={provider.id} className={isSelected ? "rounded-2xl border border-stone-900 bg-white p-4 shadow-sm" : "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{provider.kind}</div>
                      <div className="mt-2 text-lg font-semibold text-stone-900">{provider.displayName}</div>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-stone-600">
                    <div><span className="font-medium text-stone-800">Model:</span> {provider.selectedModel || provider.model || provider.deployment || "Not selected"}</div>
                    <div><span className="font-medium text-stone-800">Integration:</span> {provider.requiresKey ? "API key" : "Local endpoint"}</div>
                    <div><span className="font-medium text-stone-800">Session-only protection:</span> {provider.isEnabledForSession ? "Enabled for this session" : "Not retained after refresh."}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setSelectedProviderId(provider.id); setModelSearch(""); }} className="rounded-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700">Configure</button>
                    <button type="button" disabled={isPublicShowcase || provider.status !== "Connected"} onClick={() => updateProvider(provider.id, "isEnabledForSession", !provider.isEnabledForSession)} className="rounded-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700">
                      {provider.isEnabledForSession ? "Disable" : "Use for this session"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            {selectedProvider && (
              <>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Selected provider</div>
                    <h2 className="mt-2 text-2xl font-semibold text-stone-900">{selectedProvider.displayName}</h2>
                  </div>
                  <StatusBadge status={selectedProvider.status ?? "Not configured"} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedProvider.endpoint !== undefined && (
                    <Field label="Endpoint">
                      <input value={selectedProvider.endpoint ?? ""} onChange={(e) => updateProvider(selectedProvider.id, "endpoint", e.target.value)} className="field" />
                    </Field>
                  )}

                  {selectedProvider.model !== undefined && (
                    <ModelSelector
                      provider={selectedProvider}
                      modelSearch={modelSearch}
                      setModelSearch={setModelSearch}
                      updateProvider={(nextProvider) => setProviders((current) => current.map((provider) => provider.id === nextProvider.id ? nextProvider : provider))}
                    />
                  )}

                  {selectedProvider.deployment !== undefined && (
                    <Field label="Deployment name">
                      <input value={selectedProvider.deployment ?? ""} onChange={(e) => updateProvider(selectedProvider.id, "deployment", e.target.value)} className="field" />
                    </Field>
                  )}

                  {selectedProvider.apiVersion !== undefined && (
                    <Field label="API version">
                      <input value={selectedProvider.apiVersion ?? ""} onChange={(e) => updateProvider(selectedProvider.id, "apiVersion", e.target.value)} className="field" />
                    </Field>
                  )}

                  {selectedProvider.region !== undefined && (
                    <Field label="Region label">
                      <input value={selectedProvider.region ?? ""} onChange={(e) => updateProvider(selectedProvider.id, "region", e.target.value)} className="field" />
                    </Field>
                  )}

                  {selectedProvider.requiresKey && (
                    <Field label={selectedProvider.keyLabel ?? "API key"}>
                      <div className="flex items-center gap-2">
                        <input
                          type={showKeys[selectedProvider.id] ? "text" : "password"}
                          value={selectedProvider.apiKey ?? ""}
                          onChange={(e) => updateProvider(selectedProvider.id, "apiKey", e.target.value)}
                          disabled={isPublicShowcase}
                          className="field flex-1"
                        />
                        <button type="button" disabled={isPublicShowcase} onClick={() => setShowKeys((current) => ({ ...current, [selectedProvider.id]: !current[selectedProvider.id] }))} className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700">
                          {showKeys[selectedProvider.id] ? "Hide" : "Reveal"}
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-stone-500">{selectedProvider.apiKey ? redactSecrets(selectedProvider.apiKey) : "Not retained after refresh."}</div>
                    </Field>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" disabled={isPublicShowcase || busyProviderId === selectedProvider.id} onClick={() => validateProvider(selectedProvider)} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-400">
                    {busyProviderId === selectedProvider.id ? "Validating…" : "Validate connection"}
                  </button>
                  <button type="button" onClick={() => clearProvider(selectedProvider.id)} className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700">Clear configuration</button>
                  <button type="button" onClick={forgetAllKeys} className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700">Forget all keys</button>
                </div>

                <div
                  className="mt-6 space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"
                  aria-live="polite"
                  role={selectedProvider.status === "Incomplete" || selectedProvider.status === "Connection failed" ? "alert" : undefined}
                >
                  <div><span className="font-medium text-stone-900">Connection result:</span> {selectedProvider.validationMessage ?? "No validation yet."}</div>
                  <div><span className="font-medium text-stone-900">Sanitised endpoint:</span> {selectedProvider.sanitizedEndpoint || "No endpoint recorded."}</div>
                  <div><span className="font-medium text-stone-900">Selected model:</span> {selectedProvider.selectedModel || selectedProvider.model || selectedProvider.deployment || "None detected"}</div>
                  <div><span className="font-medium text-stone-900">Pricing status:</span> {selectedProvider.pricingStatus || "Pricing not configured."}</div>
                  <div><span className="font-medium text-stone-900">Last validation:</span> {selectedProvider.lastValidatedAt ? new Date(selectedProvider.lastValidatedAt).toLocaleString("en-US") : "Not yet validated"}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ModelSelector({
  provider,
  modelSearch,
  setModelSearch,
  updateProvider,
}: {
  provider: ProviderConfig;
  modelSearch: string;
  setModelSearch: (value: string) => void;
  updateProvider: (provider: ProviderConfig) => void;
}) {
  const customInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusCustomInput = useRef(false);
  const catalogueModels = modelCatalogue.filter((model) => model.provider === provider.kind);
  const filteredModels = catalogueModels.filter((model) => `${model.displayName} ${model.modelId} ${model.family} ${model.tier} ${model.suitableFor.join(" ")}`.toLowerCase().includes(modelSearch.toLowerCase()));
  const selectedCatalogueModel = getSelectedCatalogueModel(provider);
  const isCustomModel = isCustomModelSelection(provider);

  useEffect(() => {
    if (isCustomModel && shouldFocusCustomInput.current) {
      customInputRef.current?.focus({ preventScroll: true });
      shouldFocusCustomInput.current = false;
    }
  }, [isCustomModel]);

  const applyModel = (modelId: string) => {
    shouldFocusCustomInput.current = modelId === CUSTOM_MODEL_VALUE;
    updateProvider(selectProviderModel(provider, modelId));
  };

  return (
    <div className="md:col-span-2">
      <Field label="Model">
        <div className="grid gap-3 md:grid-cols-2">
          <input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} className="field" placeholder="Search models by capability" aria-label="Search provider model catalogue" />
          <select value={isCustomModel ? CUSTOM_MODEL_VALUE : selectedCatalogueModel?.modelId ?? CUSTOM_MODEL_VALUE} onChange={(event) => applyModel(event.target.value)} className="field" aria-label={`${provider.displayName} model selection`}>
            {filteredModels.map((model) => <option key={model.modelId} value={model.modelId}>{model.displayName} — {formatContext(model.contextWindow)} context</option>)}
            <option value={CUSTOM_MODEL_VALUE}>Custom model identifier</option>
          </select>
        </div>
      </Field>
      {!isCustomModel && selectedCatalogueModel ? (
        <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700">
          <strong className="text-stone-900">{selectedCatalogueModel.family}</strong> · {selectedCatalogueModel.tier} · {selectedCatalogueModel.supportsStructuredOutput ? "Structured output" : "Freeform output"} · Pricing: {selectedCatalogueModel.pricingSource === "missing" ? "Unavailable" : selectedCatalogueModel.pricingSource ?? "Catalogue"}<br />
          <span className="text-stone-600">{selectedCatalogueModel.limitations.join("; ")}</span>
        </div>
      ) : (
        <div className="mt-3">
          <label htmlFor={`custom-model-${provider.id}`} className="block text-sm font-medium text-stone-800">Custom model identifier</label>
          <input
            ref={customInputRef}
            id={`custom-model-${provider.id}`}
            value={getCustomModelIdentifier(provider)}
            onChange={(event) => updateProvider(setCustomModelIdentifier(provider, event.target.value))}
            className="field mt-2"
            placeholder="Enter the provider model identifier"
            aria-describedby={`custom-model-help-${provider.id}`}
          />
          <p id={`custom-model-help-${provider.id}`} className="mt-2 text-xs text-stone-500">
            Enter the exact model identifier expected by this provider or enterprise gateway.
          </p>
        </div>
      )}
    </div>
  );
}

function formatContext(tokens?: number) {
  return tokens ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(tokens) : "Not published";
}

function StatusBadge({ status }: { status: ProviderConfig["status"] }) {
  const tone: Record<string, string> = {
    "Not configured": "bg-stone-100 text-stone-700",
    Incomplete: "bg-amber-100 text-amber-800",
    "Ready to validate": "bg-blue-100 text-blue-800",
    Validating: "bg-yellow-100 text-yellow-800",
    Connected: "bg-emerald-100 text-emerald-800",
    "Connection failed": "bg-red-100 text-red-800",
    "Local endpoint unavailable": "bg-orange-100 text-orange-800",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone[status ?? "Not configured"] ?? "bg-stone-100 text-stone-700"}`}>
      {status ?? "Not configured"}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-stone-700">
      <span className="mb-2 block font-medium text-stone-800">{label}</span>
      {children}
    </label>
  );
}
