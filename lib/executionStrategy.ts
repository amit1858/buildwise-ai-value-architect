import type {
  BuildwiseInput,
  DecisionSpineOutput,
  ModuleOutput,
  ExecutionItem,
  ExecutionStrategy,
} from "./types";

// ── Low-code tool map ─────────────────────────────────────────

const LOWCODE_TOOL: Record<string, { primary: string; why: string }> = {
  marketplace:      { primary: "Bubble",                 why: "Native marketplace workflows, user roles, and payment integrations without custom code." },
  "developer tool": { primary: "Retool",                 why: "API-connected, data-rich interfaces that developers and technical users expect." },
  "internal tool":  { primary: "Retool or AppSmith",     why: "Built for internal ops - connects to any database, supports RBAC, ships fast." },
  "mobile app":     { primary: "FlutterFlow",            why: "Visual Flutter builder with native performance and app store deployment." },
  "AI tool":        { primary: "Bubble + OpenAI plugin", why: "Fastest way to wire a UI to an AI backend without writing server code." },
  "analytics tool": { primary: "Retool + Metabase",      why: "Retool for interactive tools, Metabase for read-only dashboards and reporting." },
  "e-commerce":     { primary: "Shopify",                why: "Purpose-built for e-commerce - payments, inventory, and storefronts out of the box." },
  SaaS:             { primary: "Bubble",                 why: "Full-stack no-code with auth, database, and workflow automation built in." },
};

// ── Repo structure (pro-code) ─────────────────────────────────

function getRepoStructure(spine: DecisionSpineOutput): string {
  const lines = [
    "/app",
    "  layout.tsx",
    "  page.tsx                    ← Home / input form",
    "  /api",
    "    /generate",
    "      route.ts                ← Core generation endpoint",
    "    /auth",
    "      [...nextauth]/route.ts  ← Auth handler",
    "  /results",
    "    page.tsx                  ← Plan output display",
    "  /dashboard",
    "    page.tsx                  ← Authenticated home (Sprint 2)",
    "/components",
    "  InputForm.tsx",
    "  /ui                         ← Button, Card, Input shared components",
    "/lib",
    "  types.ts",
    "  decisionSpine.ts",
    "  moduleRunner.ts",
    "  executionStrategy.ts",
    "  db.ts                       ← Database client",
    "  auth.ts                     ← Auth config + session helpers",
    "  validations.ts              ← Zod schemas for all inputs",
    "  /modules",
    "    problem.ts",
    "    persona.ts",
    "    buildStrategy.ts",
  ];

  if (spine.complexity !== "simple") {
    lines.push("    architecture.ts");
  }
  lines.push(
    "    monetization.ts",
    "    database.ts",
    "    buildHandoff.ts",
    "middleware.ts                  ← Auth guard for protected routes",
    ".env.local",
    "next.config.ts",
    "tsconfig.json",
  );

  if (spine.complexity === "complex") {
    lines.push(
      "",
      "── extracted when needed ──────────────────────────────────",
      "/services",
      `  /auth          ← Separate auth service (at scale)`,
      "  /billing       ← Stripe or Azure Marketplace billing",
      "  /notifications ← Email / webhook / push layer",
    );
  }

  return lines.join("\n");
}

// ── Pro-code outputs ──────────────────────────────────────────

function buildProCodeOutputs(
  input: BuildwiseInput,
  spine: DecisionSpineOutput,
  modules: Record<string, ModuleOutput>
): ExecutionItem[] {
  const primaryDb =
    (modules["Database Recommendation"]?.details?.primaryDatabase as string) ?? "Azure SQL";
  const archDecision =
    modules["Architecture"]?.keyDecision ?? "Start with a monolith.";
  const slug = spine.mvpWedge.replace(/\s+/g, "-").toLowerCase();

  return [
    {
      label: "Repository Structure",
      type: "code",
      content: getRepoStructure(spine),
    },
    {
      label: "Implementation Sequence",
      type: "list",
      content: [
        `Initialize repo: npx create-next-app@latest --typescript`,
        `Set up auth (NextAuth / Clerk) before writing any app logic - retrofitting auth is expensive`,
        `Define the core database schema for ${spine.mvpWedge} using ${primaryDb}`,
        `Create the API route: POST /api/${slug}`,
        `Build the single frontend page that calls this route`,
        `Wire the full end-to-end flow - skip UI polish until it works`,
        `Deploy staging: Vercel or Railway`,
        `Get a real user through the flow before adding anything else`,
      ],
    },
    {
      label: "Frontend Scaffold Plan",
      type: "list",
      content: [
        `/app/page.tsx → Landing page with InputForm`,
        `/app/results/page.tsx → Plan output display`,
        `/app/dashboard/page.tsx → Authenticated home (Sprint 2)`,
        `/components/InputForm.tsx → Core input form`,
        `/components/ui/ → Button, Card, Input, Badge shared primitives`,
        `State strategy: sessionStorage for MVP → server state after validation`,
        `Styling: Tailwind CSS - stay with existing design tokens`,
      ],
    },
    {
      label: "Backend / API Structure",
      type: "list",
      content: [
        `/api/generate/route.ts → Core plan generation (complete)`,
        `/api/auth/[...nextauth]/route.ts → Auth handler`,
        `/api/user/route.ts → User profile read/write`,
        spine.productType === "marketplace"
          ? `/api/listings/route.ts → Listing CRUD`
          : `/api/${spine.productType.replace(/\s+/g, "-")}/route.ts → Core domain endpoint`,
        `All request bodies validated with Zod before processing`,
        `All errors return: { error: string, status: number }`,
      ],
    },
    {
      label: "Key Files to Create",
      type: "list",
      content: [
        `lib/db.ts → ${primaryDb} client and connection pool`,
        `lib/auth.ts → Auth config, session type extensions, helper functions`,
        `lib/validations.ts → Zod schemas for BuildwiseInput and all API bodies`,
        `lib/errors.ts → Typed AppError class for consistent API error responses`,
        `middleware.ts → Protect /dashboard and all /api/user routes`,
      ],
    },
    {
      label: "Architecture Decision",
      type: "text",
      content: archDecision,
    },
    {
      label: "Module Placeholders",
      type: "list",
      content: spine.recommendedModules.map((m) => {
        const decision = modules[m]?.keyDecision?.slice(0, 90) ?? "pending";
        return `${m}: "${decision}${modules[m]?.keyDecision?.length > 90 ? "…" : ""}"`;
      }),
    },
    {
      label: "Testing Checklist",
      type: "list",
      content: [
        `☐ New user can sign up and reach authenticated state`,
        `☐ Core ${spine.mvpWedge} flow completes end-to-end`,
        `☐ Data persists across sessions and page refreshes`,
        `☐ API returns consistent error shape for invalid input`,
        `☐ Auth middleware blocks unauthenticated requests to protected routes`,
        `☐ npx tsc --noEmit passes with zero errors`,
        `☐ Real user completes core flow without guidance`,
      ],
    },
  ];
}

// ── Low-code sprint prompts ───────────────────────────────────

function buildLowCodeOutputs(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ExecutionItem[] {
  const tool = LOWCODE_TOOL[spine.productType]?.primary ?? "Bubble";

  return [
    {
      label: "Recommended Tool",
      type: "text",
      content: `${tool} - ${LOWCODE_TOOL[spine.productType]?.why ?? "Best fit for this product type."}`,
    },
    {
      label: "Sprint 1 - MVP Wedge Prompt",
      type: "prompt",
      content: `Build the core "${spine.mvpWedge}" flow using ${tool}.

Context:
- User type: ${spine.personaType}
- Goal: ${input.goal}
- Constraints: ${spine.constraints.join(", ")}

Build ONLY:
1. A single screen or workflow for the ${spine.mvpWedge}
2. The minimum data model to support this flow
3. One primary action (submit, save, connect, or generate)

Do NOT build yet:
- Authentication (use ${tool}'s default)
- Admin pages or settings
- Integrations beyond the core flow
- Mobile view or responsive design`,
    },
    {
      label: "Sprint 2 - Auth + Data Prompt",
      type: "prompt",
      content: `Add user authentication and persist core data.

Using: ${tool}
Previous: Sprint 1 ${spine.mvpWedge} flow is working

Build:
1. Sign up / login flow using ${tool}'s built-in auth
2. Connect Sprint 1 data to the logged-in user
3. A simple home state after login showing the user's data
4. Basic form validation and error handling

Do NOT build yet:
- Payments or subscription flows
- User roles or permissions
- Notifications or emails
- Settings or profile pages`,
    },
    {
      label: "Sprint 3 - Polish + Launch Prompt",
      type: "prompt",
      content: `Polish the core flow and prepare for first real users.

Using: ${tool}
Previous: Auth and data persistence working

Build:
1. Fix the top 3 friction points found in Sprint 2 testing
2. Add an onboarding state for new users who have no data yet
3. Add empty states and basic error messages
4. Test the full flow end-to-end with 2-3 real users

Validate before launching:
- Can a new user complete "${spine.mvpWedge}" without any help?
- Does data persist correctly across sessions?
- Are all error states handled gracefully?
- Does it work on both desktop and mobile?`,
    },
    {
      label: "After Each Sprint - Validation Checklist",
      type: "list",
      content: [
        `Sprint 1: Can you demo the ${spine.mvpWedge} flow end-to-end in under 2 minutes?`,
        `Sprint 1: Does the data model support the flow without workarounds or hacks?`,
        `Sprint 2: Can a new user sign up and reach the core flow without any guidance?`,
        `Sprint 2: Does user data persist correctly after logout and re-login?`,
        `Sprint 3: Did 2-3 real users complete the flow without you explaining it?`,
        `Sprint 3: Are all error and empty states handled (not just the happy path)?`,
        `Launch: Is the flow completable on both desktop and mobile browsers?`,
      ],
    },
    {
      label: "What to Defer - Do Not Build Yet",
      type: "list",
      content: [
        "Payment and subscription flows - validate willingness to pay separately first",
        "Email notifications - use manual outreach until the core flow is proven",
        "Admin dashboard or reporting - your first users can tell you directly",
        "Mobile app - validate on web first unless mobile is the only viable channel",
        "Third-party integrations - build the standalone workflow before connecting it to other tools",
      ],
    },
  ];
}

// ── Public API ────────────────────────────────────────────────

export function generateExecutionStrategy(
  input: BuildwiseInput,
  spine: DecisionSpineOutput,
  modules: Record<string, ModuleOutput>
): ExecutionStrategy {
  const isProCode = spine.builderType === "pro-code";
  const tool = LOWCODE_TOOL[spine.productType]?.primary ?? "Bubble";

  return {
    builderType: spine.builderType,
    executionMode: isProCode ? "Engineering Scaffold Plan" : "Low-Code Sprint Prompts",
    summary: isProCode
      ? `Pro-code scaffold plan for a ${spine.complexity} ${spine.productType}. Focus: ${spine.mvpWedge}. Structured for a developer or small team shipping fast without over-engineering.`
      : `Prompt-driven sprint plan for building a ${spine.productType} in ${tool} without writing code. Optimized for ${spine.personaType}s who want to ship and validate in 2-3 weeks.`,
    outputs: isProCode
      ? buildProCodeOutputs(input, spine, modules)
      : buildLowCodeOutputs(input, spine),
    nextSteps: isProCode
      ? [
          `Run: npx create-next-app@latest --typescript`,
          "Set up auth before writing any domain logic",
          `Build the single endpoint that powers ${spine.mvpWedge}`,
          "Deploy to staging after first working end-to-end flow",
        ]
      : [
          `Sign up for ${tool} and create a new blank app`,
          `Copy the Sprint 1 prompt above into the AI builder or use it as your build spec`,
          `Build only the ${spine.mvpWedge} - nothing more in Sprint 1`,
          "Get 2 real users to test Sprint 1 before starting Sprint 2",
        ],
  };
}
