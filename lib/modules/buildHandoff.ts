import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "../types";

const HANDOFF_BY_BUILDER: Record<string, { week1: string[]; defer: string[] }> = {
  "pro-code": {
    week1: [
      "Initialize repository with chosen stack (Next.js + TypeScript recommended)",
      "Set up auth (NextAuth / Clerk / Azure AD B2C) — this is the most expensive thing to retrofit",
      "Create the database schema for the core entity only",
      "Build the single screen or API endpoint that delivers the MVP wedge",
      "Deploy to a staging environment (Vercel, Railway, or Azure App Service)",
    ],
    defer: [
      "Do not set up CI/CD pipelines until you have something worth shipping",
      "Do not add a second database before the first is working under real load",
      "Do not build admin panels, settings pages, or billing flows until core loop is validated",
    ],
  },
  "low-code": {
    week1: [
      "Create the app in your chosen platform (Bubble, Webflow, Retool, etc.)",
      "Build the single workflow that represents the MVP wedge",
      "Wire up authentication (use the platform's built-in auth — do not custom build it)",
      "Set up basic data collection to capture what users actually do",
      "Share with 3 real users and watch them use it — do not explain it",
    ],
    defer: [
      "Do not build integrations until core workflow is validated",
      "Do not customize the UI beyond what is needed to communicate value",
      "Do not add a mobile view until desktop is working and tested",
    ],
  },
};

export function generateModule(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ModuleOutput {
  const handoff = HANDOFF_BY_BUILDER[spine.builderType] ?? HANDOFF_BY_BUILDER["pro-code"];

  return {
    title: "Build Handoff",
    summary: `Execution package for a ${spine.builderType} builder. Focus: ${spine.mvpWedge}. ${spine.complexity === "simple" ? "This is a simple build — resist adding complexity." : spine.complexity === "medium" ? "Medium complexity — make architecture decisions before writing application code." : "High complexity — define boundaries and contracts before implementation."}`,
    keyDecision: `Build the ${spine.mvpWedge} and ONLY the ${spine.mvpWedge}. Everything else is a distraction until this is validated with real users.`,
    reasoning: `The handoff package is designed to get a real user through the core loop as fast as possible. Speed of validation is more valuable than quality of implementation at this stage. Every hour spent on features outside the MVP wedge is an hour not spent learning whether the core bet is correct.`,
    tradeoffs: [
      "Fast iteration creates learning debt — schedule a refactor sprint after MVP validation",
      "Skipping auth setup now creates a major retrofit cost later — this is the one exception to 'defer everything'",
      "Perfect architecture documentation slows down the first build — keep it minimal and evolve it",
    ],
    risks: [
      "No definition of done for the MVP — without a clear success metric, you will keep building forever",
      "First user is the founder — get a real user who doesn't know you testing within week 2",
      "Pivoting before shipping — the learning from a bad launch is more valuable than no launch",
    ],
    nextSteps: [
      ...handoff.week1,
      "--- DEFER UNTIL VALIDATED ---",
      ...handoff.defer,
    ],
  };
}
