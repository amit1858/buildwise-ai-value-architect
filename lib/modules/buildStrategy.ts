import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "../types";

const STACK_BY_BUILDER: Record<string, string> = {
  "pro-code": "Next.js + TypeScript + Vercel (frontend), Node.js or Python API (backend), PostgreSQL or Cosmos DB (data)",
  "low-code": "Bubble or Webflow (UI), Xano or Supabase (backend), Airtable or Notion (data layer)",
};

const TIMELINE_BY_COMPLEXITY: Record<string, string> = {
  simple: "1-2 weeks for the MVP wedge",
  medium: "3-5 weeks for a shippable v1",
  complex: "6-10 weeks for an architecture-first foundation",
};

const LOW_CODE_PLATFORMS: Record<string, string> = {
  marketplace: "Sharetribe or Bubble with marketplace plugin",
  "developer tool": "Retool for internal tooling, or build thin wrappers around APIs",
  "internal tool": "Retool, AppSmith, or PowerApps",
  "mobile app": "FlutterFlow or Adalo for no-code mobile",
  "AI tool": "Bubble + OpenAI integration, or Glide for simple AI apps",
  "analytics tool": "Retool + connected database, or Metabase for BI dashboards",
  "e-commerce": "Shopify or WooCommerce with app extensions",
  SaaS: "Bubble for MVP, migrate to custom code at scale",
};

export function generateModule(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ModuleOutput {
  const isProCode = spine.builderType === "pro-code";
  const timeline = TIMELINE_BY_COMPLEXITY[spine.complexity] ?? "4-6 weeks";
  const stack = isProCode
    ? STACK_BY_BUILDER["pro-code"]
    : (LOW_CODE_PLATFORMS[spine.productType] ?? STACK_BY_BUILDER["low-code"]);

  return {
    title: "Build Strategy",
    summary: `Build a ${spine.complexity}-complexity ${spine.productType} using ${spine.builderType} approach. Start with the ${spine.mvpWedge}. Estimated timeline: ${timeline}. Recommended tooling: ${stack}.`,
    keyDecision: `Ship the ${spine.mvpWedge} first. Do not build features that are not directly required to validate this wedge.`,
    reasoning: `The ${spine.mvpWedge} is the single workflow that will prove or disprove product-market fit. Building beyond it before validation wastes the most expensive resource: founder time. The ${spine.builderType} approach matches the builder's available skills and the product's complexity level.`,
    tradeoffs: [
      isProCode
        ? "Pro-code gives full control but requires more setup time upfront"
        : "Low-code ships faster but may hit platform limits at scale",
      `${spine.complexity === "complex" ? "Complex systems need early architecture decisions that are expensive to undo" : "Simple scope allows fast pivots - don't over-architect"}`,
      "Shipping fast creates learning loops; shipping perfectly wastes validation time",
    ],
    risks: [
      "Scope expansion before validating the MVP wedge is the #1 build risk",
      isProCode
        ? "Technical debt accumulates fast when moving fast without an architecture plan"
        : "Low-code lock-in: migrating off a no-code platform is painful and expensive",
      `${spine.complexity === "complex" ? "Complex builds often take 2x the estimated time - build for this buffer" : "Simple builds can be over-engineered by developers who add unnecessary abstractions"}`,
    ],
    nextSteps: [
      `Set up the project with: ${stack}`,
      `Build ONLY the ${spine.mvpWedge} - nothing else`,
      `Get the first user through the ${spine.mvpWedge} flow within ${spine.complexity === "simple" ? "1 week" : "2 weeks"}`,
      "Define done: what does a successful MVP test look like in measurable terms?",
      "After MVP validation: run a retrospective before adding the next feature",
    ],
  };
}
