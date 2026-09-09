import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "../types";

const ARCH_BY_PRODUCT: Record<string, string> = {
  marketplace: "Event-driven with separate buyer and seller contexts. Use a transaction service to coordinate flows.",
  "developer tool": "API-first design. Thin server layer, thick client SDK. Versioned endpoints from day one.",
  "internal tool": "Monolith with RBAC. Single deployable, PostgreSQL, admin panel. Extract services only when team size demands it.",
  "mobile app": "BFF (Backend for Frontend) pattern. Mobile-optimized API, push notification service, offline-first data sync.",
  "AI tool": "Prompt abstraction layer over the model. Stateless API calls with optional session context. Rate limiting and cost controls built in.",
  "analytics tool": "Read-optimized data layer. Separate OLTP (writes) from OLAP (reads). Cache aggregations. Use views or materialized tables.",
  "e-commerce": "Storefront + headless commerce API + inventory service. Keep payments behind a dedicated service boundary.",
  SaaS: "Multi-tenant monolith first. Shared database with tenant isolation. Extract services only at scale thresholds.",
};

const COMPLEXITY_PATTERN: Record<string, string> = {
  simple: "Single deployable monolith. One database. No queue. Deploy to Vercel or Railway.",
  medium: "Monolith + background job queue. One primary database, optional Redis cache. Separate auth service acceptable.",
  complex: "Bounded services with async messaging. Separate auth, core domain, and notification services. API gateway at the edge.",
};

export function generateModule(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ModuleOutput {
  const arch = ARCH_BY_PRODUCT[spine.productType] ?? ARCH_BY_PRODUCT["SaaS"];
  const pattern = COMPLEXITY_PATTERN[spine.complexity] ?? COMPLEXITY_PATTERN["medium"];

  return {
    title: "Architecture",
    summary: `Recommended pattern for a ${spine.complexity} ${spine.productType}: ${pattern} ${arch}`,
    keyDecision: `Start with a ${spine.complexity === "complex" ? "service-oriented" : "monolithic"} architecture. ${spine.complexity === "complex" ? "Define service boundaries early — they are expensive to change." : "Do not split services until you hit a concrete bottleneck."}`,
    reasoning: `A ${spine.complexity === "simple" ? "monolith" : spine.complexity === "medium" ? "monolith with a job queue" : "service-oriented approach"} is the right starting point for this complexity level. Premature distribution is one of the most common causes of failed startups — you pay the operational cost before you have the traffic to justify it.`,
    tradeoffs: [
      "Monolith: faster to build, easier to debug, harder to scale independently",
      "Microservices: independently scalable, but 3–5x more infrastructure complexity",
      spine.complexity === "complex"
        ? "Complex products need clear service contracts early — without them, distributed systems become a distributed monolith"
        : "For simple/medium complexity, the cost of service extraction outweighs the benefits until ~10k users",
    ],
    risks: [
      "Building microservices before product-market fit — you'll rewrite services that shouldn't exist",
      "No auth strategy defined early — retrofitting auth is expensive",
      spine.productType === "marketplace"
        ? "Marketplace transaction integrity — distributed transactions require careful design"
        : "Database schema migrations at scale — plan for zero-downtime migrations from the start",
    ],
    nextSteps: [
      `Draw the system diagram: ${spine.complexity === "simple" ? "client → API → DB" : "client → API gateway → services → databases"}`,
      "Define auth strategy: session-based, JWT, or OAuth — decide before writing the first route",
      "Choose deployment target: Vercel, Railway, Azure App Service, or AKS",
      spine.complexity === "complex"
        ? "Document service boundaries and ownership before writing code"
        : "Create a single repository with clear folder boundaries — enforce them in code review",
    ],
  };
}
