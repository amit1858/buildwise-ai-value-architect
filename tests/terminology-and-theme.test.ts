import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("runtime documentation and configuration", () => {
  it("uses BuildWise provider test terminology and excludes cross-product terms", () => {
    const content = ["DEPLOYMENT_ARCHITECTURE.md", "SECURITY_AND_BYOK.md", "MODEL_CATALOGUE.md"].map(read).join("\n");
    expect(content).toMatch(/Controlled Model Test|Provider Connection Test|Live Provider Test|Simulated Demo Test/);
    const excludedTerms = [["Case", "Investigator"].join(" "), ["Asset", "OS"].join(" "), ["K", "201"].join("-")];
    expect(content).not.toMatch(new RegExp(excludedTerms.join("|")));
  });

  it("keeps BuildWise theme surfaces paired and scoped", () => {
    const css = read("app/globals.css");
    expect(css).toContain(".bw-page");
    expect(css).toContain(".bw-panel");
    expect(css).toContain("--surface-primary");
    expect(css).toContain("--surface-primary-fg");
    expect(css).toContain("--surface-inverse");
    expect(css).toContain("--surface-inverse-fg");
    expect(css).toContain("--surface-selected");
    expect(css).toContain("--surface-selected-fg");
    expect(css).toContain("--action-primary");
    expect(css).toContain("--action-primary-fg");
    expect(css).not.toMatch(/^\.(?:bg|text)-stone-[^{]+\{[^}]*!important/gm);
    expect(css).not.toMatch(/^\[class\*="border-stone-"\]/m);
    expect(css).toContain(":focus-visible");
  });

  it("keeps public-demo controls generated from the deployment boundary", () => {
    const config = read("next.config.ts");
    expect(config).toContain("NEXT_PUBLIC_BUILDWISE_PUBLIC_DEMO");
    expect(read("app/api/providers/validate/route.ts")).toContain("PUBLIC_DEMO");
    expect(read("app/api/providers/test/route.ts")).toContain("PUBLIC_DEMO");
  });

  it("explains BuildWise token economics as part of the complete delivery journey", () => {
    const landing = read("components/landing/LandingPage.tsx");
    expect(landing).toContain("Token maxxing is a system-design problem");
    expect(landing).toContain("Reactive usage caps");
    expect(landing).toContain("problem complexity to task decomposition, model selection, prompt design, token use, governance, and ROI");
    expect(landing).toContain("implementation-ready Build Kit");
    expect(landing).toContain("expands the Low-code, Pro-code, and Hybrid journey rather than replacing it");
  });
});
