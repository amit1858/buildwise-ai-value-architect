import { modelCatalogue, type ProviderConfig } from "@/lib/buildwise";

export const CUSTOM_MODEL_VALUE = "__custom__";

export function getSelectedCatalogueModel(provider: ProviderConfig) {
  const modelId = provider.selectedModel || provider.model || "";
  return modelCatalogue.find((model) => model.provider === provider.kind && model.modelId === modelId);
}

export function isCustomModelSelection(provider: ProviderConfig) {
  if (provider.model === undefined) return false;
  if (provider.isCustomModel !== undefined) return provider.isCustomModel;
  return !getSelectedCatalogueModel(provider);
}

export function getCustomModelIdentifier(provider: ProviderConfig) {
  if (!isCustomModelSelection(provider)) return "";
  return provider.customModel ?? provider.selectedModel ?? provider.model ?? "";
}

export function selectProviderModel(provider: ProviderConfig, modelId: string): ProviderConfig {
  if (modelId === CUSTOM_MODEL_VALUE) {
    return {
      ...provider,
      isCustomModel: true,
      customModel: "",
      model: "",
      selectedModel: "",
    };
  }

  return {
    ...provider,
    isCustomModel: false,
    customModel: "",
    model: modelId,
    selectedModel: modelId,
  };
}

export function setCustomModelIdentifier(provider: ProviderConfig, modelId: string): ProviderConfig {
  return {
    ...provider,
    isCustomModel: true,
    customModel: modelId,
    model: modelId,
    selectedModel: modelId,
  };
}

export function getProviderValidationModel(provider: ProviderConfig) {
  if (provider.kind === "azure-openai") return provider.deployment?.trim() ?? "";
  if (isCustomModelSelection(provider)) return getCustomModelIdentifier(provider).trim();
  return (provider.selectedModel || provider.model || "").trim();
}

export function clearCustomModelIdentifier(provider: ProviderConfig): ProviderConfig {
  if (!isCustomModelSelection(provider)) return provider;
  return {
    ...provider,
    customModel: "",
    model: "",
    selectedModel: "",
    isCustomModel: true,
  };
}
