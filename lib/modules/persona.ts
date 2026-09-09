import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "../types";

const PERSONA_PAINS: Record<string, string> = {
  developer: "context switching, slow tooling, and repetitive setup tasks",
  founder: "prioritization, resource constraints, and moving fast without breaking things",
  "product manager": "stakeholder alignment, scope creep, and shipping on time",
  "growth / sales": "lead conversion, pipeline visibility, and attribution accuracy",
  designer: "feedback loops, inconsistent design systems, and handoff friction",
  "internal team": "manual processes, lack of visibility, and siloed data",
  learner: "finding the right path, staying motivated, and tracking progress",
  freelancer: "client management, scope creep, and getting paid on time",
  "small business": "operational overhead, customer retention, and time-to-value",
};

const PERSONA_VALUE: Record<string, string> = {
  developer: "time saved on setup, fewer context switches, faster shipping",
  founder: "clarity on what to build, reduced waste, faster product-market fit",
  "product manager": "faster decisions, better stakeholder buy-in, cleaner roadmaps",
  "growth / sales": "more pipeline, less manual work, clearer attribution",
  designer: "faster iteration, consistent output, smoother handoffs",
  "internal team": "time saved on manual tasks, better data visibility",
  learner: "faster skill acquisition, clearer progress, higher completion rates",
  freelancer: "less admin, more billable hours, smoother client relationships",
  "small business": "less overhead, more customer retention, faster operations",
};

export function generateModule(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ModuleOutput {
  const pain = PERSONA_PAINS[spine.personaType] ?? "friction in their daily workflow";
  const value = PERSONA_VALUE[spine.personaType] ?? "time saved and reduced friction";

  return {
    title: "Target Persona",
    summary: `Primary user: ${spine.personaType} (from: "${input.persona}"). This persona typically struggles with ${pain}. The product should deliver clear value through ${value}.`,
    keyDecision: `Design and optimize the entire MVP for the ${spine.personaType} persona. Every feature decision should pass the test: "does this reduce friction for a ${spine.personaType}?"`,
    reasoning: `Focusing on a single persona prevents building a product that's mediocre for everyone. The ${spine.personaType} profile has a clear pain pattern and measurable value metric, making it the right anchor for the MVP.`,
    tradeoffs: [
      `Focusing on ${spine.personaType}s may exclude adjacent users initially`,
      "Tight persona focus makes onboarding and messaging much clearer",
      "Expanding to multiple personas too early creates product identity problems",
    ],
    risks: [
      `Assuming all ${spine.personaType}s have the same pain — validate with 3–5 individuals`,
      "Building for a persona that exists but won't pay (consumer vs. enterprise mismatch)",
      "Underestimating the technical literacy gap between you and your target user",
    ],
    nextSteps: [
      `Write a persona card: name, role, daily workflow, biggest frustration, definition of success`,
      `Identify where ${spine.personaType}s currently solve this problem (tools, workarounds, spreadsheets)`,
      "Map a 5-step user journey from awareness to value — find the biggest drop-off point",
      "Decide: are you selling to the persona or is someone else buying on their behalf?",
    ],
  };
}
