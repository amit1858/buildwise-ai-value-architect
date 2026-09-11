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

  it("keeps provider theme surfaces scoped", () => {
    const css = read("app/globals.css");
    expect(css).toContain(".bw-page");
    expect(css).toContain(".bw-panel");
    expect(css).toContain(":focus-visible");
  });

  it("keeps public-demo controls generated from the deployment boundary", () => {
    const config = read("next.config.ts");
    expect(config).toContain("NEXT_PUBLIC_BUILDWISE_PUBLIC_DEMO");
    expect(read("app/api/providers/validate/route.ts")).toContain("PUBLIC_DEMO");
    expect(read("app/api/providers/test/route.ts")).toContain("PUBLIC_DEMO");
  });
});
