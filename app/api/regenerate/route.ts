import type { BuildwiseInput, DecisionSpineOutput, ModuleOutput } from "@/lib/types";
import { runModules } from "@/lib/moduleRunner";

function validate(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return "Invalid request body.";
  const r = raw as Record<string, unknown>;
  if (!r.moduleName || typeof r.moduleName !== "string") return "moduleName is required.";
  if (typeof r.feedback !== "string") return "feedback must be a string.";
  if (!r.input || typeof r.input !== "object") return "input is required.";
  if (!r.decisionSpine || typeof r.decisionSpine !== "object") return "decisionSpine is required.";
  return null;
}

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const err = validate(raw);
  if (err) return Response.json({ error: err }, { status: 400 });

  const { moduleName, feedback, input, decisionSpine } = raw as {
    moduleName: string;
    feedback: string;
    input: BuildwiseInput;
    decisionSpine: DecisionSpineOutput;
  };

  // Append user feedback to constraints so rule-based modules can reflect it
  const modifiedInput: BuildwiseInput = {
    ...input,
    constraints: feedback
      ? `${input.constraints ? input.constraints + "; " : ""}User feedback: ${feedback}`
      : input.constraints,
  };

  const modules = runModules(modifiedInput, {
    ...decisionSpine,
    recommendedModules: [moduleName],
  });

  const mod: ModuleOutput | undefined = modules[moduleName];

  if (!mod) {
    return Response.json(
      { error: `Module "${moduleName}" not found in registry.` },
      { status: 404 }
    );
  }

  return Response.json(mod);
}
