# BuildWise product restoration plan

## Audit baseline

The public repository currently contains a verified static demo centred on:

- seeded enterprise intake and workload spine;
- editable workflow task routing;
- Baseline, Economy, Balanced, and Assurance scenario economics;
- task-level token and cost traces;
- prompt comparison;
- simulated and mock controlled tests;
- blueprint JSON/Markdown export;
- session-only BYOK contracts for the server-capable application;
- Light, Dark, and System themes;
- GitHub Pages deployment with `PUBLIC_DEMO=true`.

The current runtime navigation is `Workload spine`, `Workflow`, `Scenarios`, `Prompts`, `Controlled test`, and `Blueprint`. It does not yet expose the original BuildWise delivery-design journey as a first-class product.

## Historical source evidence

The local AMU repository history contains earlier BuildWise material including:

| Capability | Evidence | Decision |
|---|---|---|
| Build-path selection | `lib/executionStrategy.ts`, `lib/modules/buildStrategy.ts`, historical intake components | Rebuild as typed, public-safe domain logic rather than copy old UI |
| Low-code guidance | `lib/executionStrategy.ts` low-code tool maps and sprint prompts | Rebuild as path-specific Build Kit artifacts |
| Pro-code scaffolding | `lib/executionStrategy.ts` pro-code outputs and build prompts | Rebuild as generated Copilot/coding-agent prompt artifacts |
| Hybrid delivery | historical build-strategy modules and implementation-planning branches | Rebuild with explicit ownership and integration boundaries |
| Guided intake | historical `components/intake/ProjectIntake.tsx` | Expand current intake schema progressively |
| Architecture and handoff | historical module files and `app/results/page.tsx` | Rebuild as current-project artifacts with provenance |
| Token/cost intelligence | current `lib/buildwise.ts` and public evidence | Preserve as the cross-cutting decision layer |

The AMU repository and its Git history will not be merged into the public repository. Historical code is reference evidence only.

## Restoration decisions

1. Complete the Phase 0 truthfulness gate first: shared provenance-aware cost formatting, truthful simulation labels, and public-demo capability boundaries.
2. Add a typed delivery model covering Low-code, Pro-code, and Hybrid paths.
3. Add `build-path`, `build-kit`, and suitability surfaces while preserving existing route compatibility.
4. Generate path-specific artifacts from the actual project, tasks, governance settings, selected route, and scenario economics.
5. Rebuild the public landing page around the complete value proposition, using an original BuildWise visual system informed by—not copied from—the Signal-to-Action reference.
6. Add feedback/calibration as an explicit user-confirmed loop.

## Intended user value

BuildWise should help an executive or delivery team answer:

1. Whether AI is appropriate for the problem.
2. Which work should be deterministic, automated, AI-assisted, or human-reviewed.
3. Whether Low-code, Pro-code, or Hybrid delivery is the best fit.
4. Which model, provider, prompt, context, and budget policy fit the task.
5. What the delivery team should build next.

## Planned routes

| Journey stage | Route |
|---|---|
| Define | `/new` |
| Assess | `/workspace/[projectId]/suitability` |
| Decompose | `/workspace/[projectId]/spine` |
| Choose build path | `/workspace/[projectId]/build-path` |
| Design workflow | `/workspace/[projectId]/workflow` |
| Optimize intelligence | `/workspace/[projectId]/prompts` |
| Compare economics | `/workspace/[projectId]/scenarios` |
| Generate build kit | `/workspace/[projectId]/build-kit` |
| Validate and improve | `/workspace/[projectId]/test` |
| Blueprint compatibility | `/workspace/[projectId]/blueprint` |

## Acceptance criteria

- Phase 0 terminology and cost semantics are truthful and regression-tested.
- Existing canonical scenario values remain unchanged.
- Public demo never accepts or sends provider credentials.
- Every seeded task has an execution classification, rationale, confidence, risk, human-review gate, and cheaper alternative.
- Users can compare and switch Low-code, Pro-code, and Hybrid paths.
- Build Kit artifacts are generated from actual project decisions and can be viewed, copied, downloaded, and exported.
- The generated Pro-code prompt is credible for a new repository; Low-code and Hybrid guides are actionable.
- Feedback can be recorded without silently changing policy.
- Public landing page communicates the complete BuildWise thesis.
- Desktop and mobile journeys remain responsive, accessible, and statically deployable.
