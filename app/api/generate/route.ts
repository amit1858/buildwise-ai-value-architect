import type {
  BuildwiseInput,
  DecisionSpineOutput,
  ExecutionStrategy,
  GenerateResponse,
  ResponseMetadata,
} from "@/lib/types";
import { runDecisionSpine } from "@/lib/decisionSpine";
import { runModules } from "@/lib/moduleRunner";
import { generateExecutionStrategy } from "@/lib/executionStrategy";

// ── Input validation ──────────────────────────────────────────

function validateInput(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return "Invalid request body.";
  const i = raw as Record<string, unknown>;

  if (!i.problem || typeof i.problem !== "string" || i.problem.trim().length < 10)
    return "Problem statement must be at least 10 characters.";
  if (!i.persona || typeof i.persona !== "string" || i.persona.trim().length < 3)
    return "Target persona must be at least 3 characters.";
  if (!i.goal || typeof i.goal !== "string" || i.goal.trim().length < 3)
    return "Business goal must be at least 3 characters.";
  if (!["low-code", "pro-code"].includes(i.builderType as string))
    return "Builder type must be 'low-code' or 'pro-code'.";

  return null;
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  // 1. Parse body
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  // 2. Validate
  const validationError = validateInput(raw);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const input = raw as BuildwiseInput;

  // 3. Decision spine - if this fails the whole request fails
  let decisionSpine: DecisionSpineOutput;
  try {
    decisionSpine = runDecisionSpine(input);
  } catch (err) {
    return Response.json(
      {
        error: "Failed to build decision spine.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  // 4. Modules - per-module errors are handled inside runModules
  const modules = runModules(input, decisionSpine);

  // 5. Execution strategy - gracefully degrade to null on failure
  let executionStrategy: ExecutionStrategy | null = null;
  try {
    executionStrategy = generateExecutionStrategy(input, decisionSpine, modules);
  } catch {
    // modules + spine still returned; UI handles null executionStrategy
  }

  // 6. Metadata
  const modulesGenerated = Object.values(modules).filter((m) => !m.error).length;
  const metadata: ResponseMetadata = {
    generatedAt: new Date().toISOString(),
    version: "1.0.0",
    mode: "mock",
    modulesGenerated,
    builderType: input.builderType,
  };

  const response: GenerateResponse = {
    input,
    decisionSpine,
    modules,
    executionStrategy,
    metadata,
  };

  return Response.json(response);
}
