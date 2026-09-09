import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

describe("provider secret boundary", () => {
  it("does not use browser storage for provider settings or keys", () => {
    const projectStore = readFileSync(path.join(root, "lib", "project-store.ts"), "utf8");
    const providerSettings = readFileSync(path.join(root, "components", "providers", "ProviderSettings.tsx"), "utf8");
    expect(projectStore).not.toContain("sessionStorage");
    expect(providerSettings).not.toContain("sessionStorage");
  });

  it("does not log credentials or authorization headers", () => {
    const adapter = readFileSync(path.join(root, "lib", "provider-adapters.ts"), "utf8");
    expect(adapter).not.toMatch(/console\.(log|error|warn)\s*\(/);
    expect(adapter).not.toMatch(/console\.[\s\S]{0,80}(apiKey|authorization|api-key)/i);
  });
});
