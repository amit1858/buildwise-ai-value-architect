import { describe, expect, it } from "vitest";
import { modelCatalogue } from "@/lib/buildwise";
import { NVIDIA_BUILD_BASE_URL, NVIDIA_BUILD_CHAT_COMPLETIONS_URL, NVIDIA_BUILD_CHAT_ROUTE, NVIDIA_BUILD_DEFAULT_MODEL } from "@/lib/model-registry";

describe("model registry", () => {
  it("keeps the NVIDIA Build endpoint contract canonical", () => {
    expect(NVIDIA_BUILD_BASE_URL).toBe("https://integrate.api.nvidia.com/v1");
    expect(NVIDIA_BUILD_CHAT_COMPLETIONS_URL).toBe(`${NVIDIA_BUILD_BASE_URL}${NVIDIA_BUILD_CHAT_ROUTE}`);
  });

  it("publishes Nemotron defaults and pricing provenance as metadata", () => {
    const model = modelCatalogue.find((entry) => entry.modelId === NVIDIA_BUILD_DEFAULT_MODEL);
    expect(model).toMatchObject({ recommendedTemperature: 1, recommendedTopP: 0.95, pricingSource: "missing" });
  });

  it("keeps custom model identifiers outside the recommended catalogue", () => {
    expect(modelCatalogue.some((entry) => entry.modelId === "custom-model")).toBe(false);
  });
});
