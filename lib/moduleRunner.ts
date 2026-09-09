import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "./types";
import { generateModule as generateProblem } from "./modules/problem";
import { generateModule as generatePersona } from "./modules/persona";
import { generateModule as generateBuildStrategy } from "./modules/buildStrategy";
import { generateModule as generateArchitecture } from "./modules/architecture";
import { generateModule as generateMonetization } from "./modules/monetization";
import { generateModule as generateDatabase } from "./modules/database";
import { generateModule as generateBuildHandoff } from "./modules/buildHandoff";

type ModuleFn = (input: BuildwiseInput, spine: DecisionSpineOutput) => ModuleOutput;

const MODULE_REGISTRY: Record<string, ModuleFn> = {
  "Problem":                 generateProblem,
  "Persona":                 generatePersona,
  "Build Strategy":          generateBuildStrategy,
  "Architecture":            generateArchitecture,
  "Monetization":            generateMonetization,
  "Database Recommendation": generateDatabase,
  "Build Handoff":           generateBuildHandoff,
};

export function runModules(
  input: BuildwiseInput,
  spine: DecisionSpineOutput
): Record<string, ModuleOutput> {
  const result: Record<string, ModuleOutput> = {};

  for (const moduleName of spine.recommendedModules) {
    const fn = MODULE_REGISTRY[moduleName];
    if (!fn) continue;

    try {
      result[moduleName] = fn(input, spine);
    } catch (err) {
      result[moduleName] = {
        title: moduleName,
        summary: "",
        keyDecision: "",
        reasoning: "",
        tradeoffs: [],
        risks: [],
        nextSteps: [],
        error: err instanceof Error ? err.message : "Module failed to generate output.",
      };
    }
  }

  return result;
}
