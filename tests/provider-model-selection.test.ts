import { describe, expect, it } from "vitest";
import type { ProviderConfig } from "@/lib/buildwise";
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

const openAi = (): ProviderConfig => ({
  id: "openai",
  kind: "openai",
  displayName: "OpenAI",
  model: "gpt-4o-mini",
  requiresKey: true,
  keyLabel: "API key",
});

describe("provider model selection", () => {
  it("selecting Custom reveals an empty custom-model state", () => {
    const selected = selectProviderModel(openAi(), CUSTOM_MODEL_VALUE);
    expect(isCustomModelSelection(selected)).toBe(true);
    expect(getCustomModelIdentifier(selected)).toBe("");
    expect(getSelectedCatalogueModel(selected)).toBeUndefined();
  });

  it("catalogue selection hides custom state and uses the canonical model ID", () => {
    const custom = setCustomModelIdentifier(selectProviderModel(openAi(), CUSTOM_MODEL_VALUE), "enterprise-model");
    const selected = selectProviderModel(custom, "gpt-4o-mini");
    expect(isCustomModelSelection(selected)).toBe(false);
    expect(selected.selectedModel).toBe("gpt-4o-mini");
    expect(selected.customModel).toBe("");
    expect(getSelectedCatalogueModel(selected)?.modelId).toBe("gpt-4o-mini");
  });

  it("uses a custom identifier as the requested provider model", () => {
    const provider = setCustomModelIdentifier(selectProviderModel(openAi(), CUSTOM_MODEL_VALUE), "enterprise-gpt");
    expect(getProviderValidationModel(provider)).toBe("enterprise-gpt");
    expect(provider.model).toBe("enterprise-gpt");
    expect(provider.selectedModel).toBe("enterprise-gpt");
  });

  it("blocks validation while the custom identifier is empty", () => {
    const provider = selectProviderModel(openAi(), CUSTOM_MODEL_VALUE);
    expect(getProviderValidationModel(provider)).toBe("");
  });

  it("keeps custom identifiers isolated by provider", () => {
    const openAiProvider = setCustomModelIdentifier(selectProviderModel(openAi(), CUSTOM_MODEL_VALUE), "enterprise-gpt");
    const anthropicProvider = selectProviderModel({
      ...openAi(),
      id: "anthropic",
      kind: "anthropic",
      displayName: "Anthropic",
      model: "claude-3-5-haiku",
    }, CUSTOM_MODEL_VALUE);
    expect(getCustomModelIdentifier(openAiProvider)).toBe("enterprise-gpt");
    expect(getCustomModelIdentifier(anthropicProvider)).toBe("");
  });

  it("clears an explicit custom identifier without clearing catalogue models", () => {
    const custom = setCustomModelIdentifier(selectProviderModel(openAi(), CUSTOM_MODEL_VALUE), "enterprise-gpt");
    expect(getCustomModelIdentifier(clearCustomModelIdentifier(custom))).toBe("");
    expect(clearCustomModelIdentifier(openAi()).model).toBe("gpt-4o-mini");
  });

  it("forgets credentials without deleting non-secret custom model settings", () => {
    const custom = setCustomModelIdentifier(selectProviderModel(openAi(), CUSTOM_MODEL_VALUE), "enterprise-gpt");
    writeSessionProviderSettings([custom]);
    setSessionProviderSecret(custom.id, "test-placeholder-not-a-real-key");

    clearAllSessionProviderSecrets();

    expect(getSessionProviderSecret(custom.id)).toBe("");
    expect(readSessionProviderSettings()[0]?.customModel).toBe("enterprise-gpt");
  });

  it("preserves Azure deployment-name semantics", () => {
    const azure: ProviderConfig = {
      id: "azure-openai",
      kind: "azure-openai",
      displayName: "Azure OpenAI",
      deployment: "support-prod",
      requiresKey: true,
      keyLabel: "API key",
    };
    expect(isCustomModelSelection(azure)).toBe(false);
    expect(getProviderValidationModel(azure)).toBe("support-prod");
  });
});
