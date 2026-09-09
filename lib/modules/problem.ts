import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "../types";

export function generateModule(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): ModuleOutput {
  const isComplex = spine.complexity === "complex";

  return {
    title: "Problem Definition",
    summary: `The core problem is: "${input.problem.slice(0, 120)}${input.problem.length > 120 ? "…" : ""}". The product is classified as a ${spine.productType} targeting ${spine.personaType}s. The recommended MVP wedge is: ${spine.mvpWedge}.`,
    keyDecision: `Solve exactly one pain point first — the ${spine.mvpWedge}. Defer all secondary problems.`,
    reasoning: `Narrowing to the ${spine.mvpWedge} reduces scope to something shippable and testable. The broader problem can be addressed in v2 once the core loop is validated.`,
    tradeoffs: [
      "Narrow scope ships faster but may feel incomplete to early users",
      "Broad scope feels more complete but risks delayed launch and wasted effort",
      isComplex
        ? "Complex systems need clear problem boundaries to avoid scope creep"
        : "Simple problems are easiest to over-engineer — resist adding features",
    ],
    risks: [
      "Problem statement is too vague — no clear success metric",
      "Solving a problem users will tolerate but not pay for",
      "Building for an assumed pain that hasn't been validated with real users",
    ],
    nextSteps: [
      `Write a one-sentence problem statement: "[persona] struggles to [problem] because [root cause]"`,
      "Identify 3 people who have this problem and talk to them before building",
      `Validate that the ${spine.mvpWedge} directly addresses the stated problem`,
      "Define what 'solved' looks like — what does the user do differently?",
    ],
  };
}
