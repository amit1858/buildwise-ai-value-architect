import type { BuildwiseInput, DecisionSpineOutput, BuilderType } from "./types";

// ── Helpers ───────────────────────────────────────────────────

/** True if any keyword appears in text (case-insensitive). */
function scan(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

/** Count of distinct keywords found in text. */
function score(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  return keywords.filter((k) => t.includes(k)).length;
}

/** Join all input fields into one lowercase string for broad signal detection. */
function all(input: BuildwiseInput): string {
  return `${input.problem} ${input.persona} ${input.goal} ${input.constraints}`.toLowerCase();
}

// ── Product Type ──────────────────────────────────────────────

const PRODUCT_TYPE_RULES: Array<{ type: string; keywords: string[] }> = [
  {
    type: "marketplace",
    keywords: ["marketplace", "two-sided", "buyers", "sellers", "peer-to-peer", "p2p", "connect buyers", "connect sellers", "listing"],
  },
  {
    type: "developer tool",
    keywords: ["api", "sdk", "webhook", "devtool", "developer tool", "cli", "library", "npm package"],
  },
  {
    type: "internal tool",
    keywords: ["internal", "employees", "team workflow", "back office", "ops tool", "hr tool", "admin tool"],
  },
  {
    type: "mobile app",
    keywords: ["mobile", "ios", "android", "app store", "play store", "native app"],
  },
  {
    type: "AI tool",
    keywords: ["ai", "gpt", "llm", "machine learning", "ml model", "chatbot", "ai assistant", "generative"],
  },
  {
    type: "analytics tool",
    keywords: ["analytics", "dashboard", "reporting", "metrics", "insights", "business intelligence", "bi tool"],
  },
  {
    type: "e-commerce",
    keywords: ["ecommerce", "e-commerce", "online store", "checkout", "product catalog", "inventory", "storefront"],
  },
];

function classifyProductType(input: BuildwiseInput): string {
  const combined = all(input);
  for (const rule of PRODUCT_TYPE_RULES) {
    if (scan(combined, rule.keywords)) return rule.type;
  }
  return "SaaS";
}

// ── Complexity ────────────────────────────────────────────────

type Complexity = "simple" | "medium" | "complex";

const COMPLEXITY_HIGH = [
  "enterprise", "large scale", "real-time", "multi-tenant", "microservices",
  "machine learning", "marketplace", "two-sided", "complex integrations",
];
const COMPLEXITY_MEDIUM = [
  "payment", "stripe", "billing", "subscription", "auth", "authentication",
  "roles", "permissions", "third-party", "integration", "api", "multi-user",
  "notifications", "email", "webhook",
];
const COMPLEXITY_LOW_CONSTRAINTS = [
  "solo", "just me", "alone", "one person", "only me",
];
const COMPLEXITY_LOW_TIMELINE = [
  "this week", "weekend", "one week", "1 week", "two weeks", "2 weeks",
  "one month", "1 month",
];
const COMPLEXITY_LOW_GOAL = [
  "simple", "basic", "mvp", "prototype", "proof of concept", "poc",
  "minimal", "quick",
];

function classifyComplexity(input: BuildwiseInput): Complexity {
  const combined = all(input);
  let n = 0;

  n += score(combined, COMPLEXITY_HIGH) * 2;
  n += score(combined, COMPLEXITY_MEDIUM);
  n -= score(input.constraints.toLowerCase(), COMPLEXITY_LOW_CONSTRAINTS);
  n -= score(input.constraints.toLowerCase(), COMPLEXITY_LOW_TIMELINE);
  n -= score(input.goal.toLowerCase(), COMPLEXITY_LOW_GOAL);

  if (n >= 4) return "complex";
  if (n >= 1) return "medium";
  return "simple";
}

// ── MVP Wedge ─────────────────────────────────────────────────

const WEDGE_VERB_RULES: Array<{ wedge: string; keywords: string[] }> = [
  { wedge: "core automation workflow",       keywords: ["automat"] },
  { wedge: "basic tracking & visibility",    keywords: ["track", "trackin"] },
  { wedge: "single workflow management",     keywords: ["manag"] },
  { wedge: "first-party connection flow",    keywords: ["connect", "match"] },
  { wedge: "one generation use case",        keywords: ["generat", "creat"] },
  { wedge: "one core report or view",        keywords: ["report", "analytic", "insight"] },
  { wedge: "basic scheduling flow",          keywords: ["schedul", "book", "calendar", "appointment"] },
  { wedge: "single collaboration unit",      keywords: ["collaborat", "share", "team"] },
  { wedge: "single purchase flow",           keywords: ["sell", "monetiz", "payment", "checkout"] },
  { wedge: "core search or discovery",       keywords: ["search", "discov", "find"] },
  { wedge: "core notification trigger",      keywords: ["notif", "alert", "remind"] },
  { wedge: "streamlined onboarding flow",    keywords: ["onboard", "signup", "sign up", "register"] },
  { wedge: "reduce manual task by one step", keywords: ["manual", "tedious", "repetitive", "save time"] },
];

const WEDGE_BY_PRODUCT_TYPE: Record<string, string> = {
  "marketplace":     "minimum viable listing + first match",
  "developer tool":  "core API integration path",
  "internal tool":   "highest-friction workflow replacement",
  "mobile app":      "single core user action",
  "AI tool":         "one prompt-to-output loop",
  "analytics tool":  "one dashboard with the key metric",
  "e-commerce":      "single product purchase flow",
  "SaaS":            "core workflow that saves the most time",
};

function deriveMvpWedge(input: BuildwiseInput, productType: string): string {
  const combined = all(input);
  for (const rule of WEDGE_VERB_RULES) {
    if (scan(combined, rule.keywords)) return rule.wedge;
  }
  return WEDGE_BY_PRODUCT_TYPE[productType] ?? "core problem-solving workflow";
}

// ── Persona Type ──────────────────────────────────────────────

const PERSONA_RULES: Array<{ type: string; keywords: string[] }> = [
  { type: "developer",       keywords: ["developer", "engineer", "programmer", "coder", "technical", "devops"] },
  { type: "founder",         keywords: ["founder", "co-founder", "startup", "entrepreneur", "ceo", "cto"] },
  { type: "product manager", keywords: ["pm", "product manager", "product owner", "director of product"] },
  { type: "growth / sales",  keywords: ["marketer", "marketing", "growth", "sales", "revenue", "gtm"] },
  { type: "designer",        keywords: ["designer", "ux", "ui", "design"] },
  { type: "internal team",   keywords: ["employees", "staff", "internal", "operations", "back office"] },
  { type: "learner",         keywords: ["student", "learner", "teacher", "educator", "school"] },
  { type: "freelancer",      keywords: ["freelancer", "consultant", "independent", "contractor"] },
  { type: "small business",  keywords: ["small business", "smb", "shop owner", "business owner", "solopreneur"] },
];

function classifyPersonaType(input: BuildwiseInput): string {
  const p = input.persona.toLowerCase();
  for (const rule of PERSONA_RULES) {
    if (scan(p, rule.keywords)) return rule.type;
  }
  return input.persona.trim() || "general user";
}

// ── Recommended Modules ───────────────────────────────────────

function recommendModules(
  productType: string,
  complexity: Complexity,
  builderType: BuilderType,
  input: BuildwiseInput
): string[] {
  const modules: string[] = ["Problem", "Persona", "Build Strategy"];

  if (builderType === "pro-code" || complexity === "complex") {
    modules.push("Architecture");
  }

  if (builderType === "pro-code" || complexity !== "simple") {
    modules.push("Database Recommendation");
  }

  const revenueSignal = scan(all(input), [
    "revenue", "monetize", "pricing", "subscription", "freemium",
    "paid", "charge", "license", "tier",
  ]);
  if (productType === "SaaS" || productType === "marketplace" || revenueSignal) {
    modules.push("Monetization");
  }

  modules.push("Build Handoff");
  return modules;
}

// ── Constraints ───────────────────────────────────────────────

function parseConstraints(raw: string): string[] {
  if (!raw.trim()) return ["no constraints specified"];
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Public API ────────────────────────────────────────────────

export function runDecisionSpine(input: BuildwiseInput): DecisionSpineOutput {
  const productType       = classifyProductType(input);
  const complexity        = classifyComplexity(input);
  const mvpWedge          = deriveMvpWedge(input, productType);
  const personaType       = classifyPersonaType(input);
  const constraints       = parseConstraints(input.constraints);
  const recommendedModules = recommendModules(productType, complexity, input.builderType, input);

  return {
    productType,
    complexity,
    mvpWedge,
    constraints,
    recommendedModules,
    personaType,
    builderType: input.builderType,
  };
}
