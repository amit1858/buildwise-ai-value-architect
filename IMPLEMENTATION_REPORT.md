# BuildWise implementation report

## Integrity status

Productization status: the seeded demo is now prepared for a GitHub Pages public-demo build. `npm run build:pages` produces the static `out/` artifact with the fixed seeded route `/workspace/demo-support-project/*`; provider validation and provider-backed execution routes return HTTP 403 when `PUBLIC_DEMO=true`. No live provider capability is claimed.

## Phase 0 truthfulness correction

The next release separates `Design estimate`, `Demo simulation`, `Mock adapter`, `Provider reported`, and `Verified live` terminology. Simulated output is never labelled actual or observed. The public controlled-test surface keeps `Run demo test`, renames the second public-safe action to `Run local adapter simulation` where applicable, and disables live provider testing with an explanation that credentials cannot be entered or sent through GitHub Pages.

Cost display now preserves exact zero as `$0.00`, displays positive sub-cent values with four decimal places, reports missing pricing as `Pricing unavailable`, and reports deterministic no-model-call work as `Not applicable`. The release evidence must be regenerated from the post-correction commit; older screenshots remain historical evidence only.

Implementation commit: `80115a20127002538dcdc51ba60ade75679fe24d`. Evidence-only packaging may follow; every release-candidate manifest entry records this implementation commit.

This report describes the current repository state. Demo figures, browser evidence, and the golden-value contract are generated from the same canonical calculation engine in `lib/buildwise.ts`.

| Capability | Status | Evidence |
|---|---|---|
| Azure OpenAI provider adapter | Verified with mocks | `lib/provider-adapters.ts`; `tests/provider-adapters.test.ts`; `npm test -- tests/provider-adapters.test.ts`; contract-shaped usage and structured-output parsing pass. Route: `/api/providers/test`. |
| OpenAI provider adapter | Verified with mocks | Same adapter contract and test file; mocked usage capture passes. Route: `/api/providers/test`. |
| Anthropic provider adapter | Verified with mocks | Same adapter contract and test file; mocked response normalization passes. Route: `/api/providers/test`. |
| NVIDIA/NIM provider adapter | Verified with mocks | Generic provider contract in `lib/provider-adapters.ts`; `tests/provider-adapters.test.ts`; mock request/response normalization passes. Route: `/api/providers/test`. |
| Generic OpenAI-compatible adapter | Verified with mocks | `lib/provider-adapters.ts`; `tests/api-routes.test.ts`; `/api/providers/test`. |
| Ollama/local-model adapter | Verified with mocks | `lib/provider-adapters.ts`; `tests/provider-adapters.test.ts`; local adapter contract is exercised without network calls. |
| Session-only API-key handling | Verified with mocks | `lib/provider-session.ts`, `lib/project-store.ts`, `tests/security-audit.test.ts`; `npm test -- tests/security-audit.test.ts`; keys are cleared before project persistence and browser evidence finds no credential values. |
| Validate-provider connection | Verified with mocks | `app/api/providers/validate/route.ts`, `tests/api-routes.test.ts`; `npm test -- tests/api-routes.test.ts`; route: `/api/providers/validate`. |
| Demo-to-Live mode transition | UI only | `components/workspace/WorkspaceShell.tsx`; live execution is disabled until provider status is Connected, but no real credential was available for live verification. |
| Controlled model execution | Verified with mocks | `lib/provider-adapters.ts`, `app/api/providers/test/route.ts`, `tests/provider-adapters.test.ts`; explicit user action only; route: `/workspace/[projectId]/test`. |
| Provider-reported input/output-token capture | Verified with mocks | `lib/provider-adapters.ts`; `tests/provider-adapters.test.ts`; mocked usage fields are normalized and rendered. |
| Actual cost calculation | Verified with mocks | `calculateTaskCostTrace` and `calculateCostTrace` in `lib/buildwise.ts`; `tests/cost-trace.test.ts`; demo catalogue pricing is applied to normalized usage. |
| Estimated-versus-actual comparison | Verified with mocks | `components/workspace/WorkspaceShell.tsx`; `tests/integrity.test.ts`; route: `/workspace/[projectId]/test`. |
| Structured-output validation | Verified with mocks | `lib/provider-adapters.ts`; `tests/provider-adapters.test.ts`; invalid structured responses are surfaced. |
| Feedback and project-specific calibration | Verified with mocks | `components/workspace/WorkspaceShell.tsx`; feedback updates calibration multipliers in project state. |
| Editable workflow decomposition | Verified with mocks | `components/workspace/WorkspaceShell.tsx`; routing editor recalculates scenarios and supports restore recommendation. Route: `/workspace/[projectId]/workflow`. |
| Baseline, Economy, Balanced and Assurance scenarios | Verified with mocks | `getScenarioTaskPolicy`, `calculateScenarioTraces`, and scenario UI; `tests/cost-trace.test.ts`; route: `/workspace/[projectId]/scenarios`. |
| Explainable model-routing decisions | Verified with mocks | `getScenarioTaskPolicy`, task explanations, and scenario assumptions; route: `/workspace/[projectId]/scenarios`. |
| Prompt optimisation comparison | Verified with mocks | task-specific prompt generation in `lib/buildwise.ts`; `tests/integrity.test.ts`; route: `/workspace/[projectId]/prompts`. |
| Blueprint export | Verified with mocks | JSON and Markdown exports in `components/workspace/WorkspaceShell.tsx`; route: `/workspace/[projectId]/blueprint`. |

No capability is labelled **Verified live** because no real provider credential was supplied. Mocked results are explicitly labelled `mock-adapter`; demo results are explicitly labelled `demo-simulation`.

## Canonical seeded-demo economics

The seeded support demo uses 100,000 monthly executions, a $12,000 monthly budget, High privacy, and BuildWise demo catalogue pricing effective 2026-09-08.

| Scenario | Monthly cost | Input | Cached | Output | Calls | Savings |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | $39,308.23 | 48,438 | 5,382 | 6,706 | 5 | 0.0% |
| Economy | $173.15 | 7,326 | 13,604 | 3,115 | 2 | 99.6% |
| Balanced | $771.27 | 12,707 | 12,708 | 3,832 | 3 | 98.0% |
| Assurance | $24,128.48 | 30,272 | 10,093 | 5,748 | 5 | 38.6% |

These are policy-derived figures, not desired savings targets. Baseline uses an advanced model and broad context for every applicable task. Economy uses deterministic triage, retrieval, and validation plus small-model extraction/generation. Balanced uses deterministic routing, filtered retrieval, selective small/standard models, schema validation, and escalation thresholds. Assurance increases context and uses stronger models plus dual validation on high-risk work. The calculation drawer exposes task-level model, tokens, calls, retries, fallback assumptions, pricing, and monthly contribution.

Balanced is the recommended cost-to-value route: it preserves deterministic controls, filtered retrieval, schema validation, and human review without premium-model routing in the seeded workload. Assurance costs substantially more for additional evidence and validation; Economy is the lowest-cost route but accepts higher review coverage and less advanced reasoning.

## Prompt accounting

Prompt cards distinguish instruction investment from request economics. They show original and optimised prompt tokens, instruction investment, context reduction, output reduction, expected retry reduction, and net request impact. Retrieval work is shown as a retrieval configuration, not mislabelled as an LLM prompt. A longer optimised instruction is described as an investment when it adds schema and safety constraints.

## Security and provenance

- Provider keys are held in in-memory session state and removed before project persistence.
- No provider key or authorisation header is written to localStorage, sessionStorage, exports, or logs.
- Demo mode makes no provider call.
- Paid/live calls require explicit user action and a successfully connected provider.
- Missing catalogue pricing is reported as unavailable, never as `$0.00`.

## Validation commands

```text
npm run typecheck
npm run lint
npm test
npm run build
npm run build:pages
npx playwright test tests/evidence.spec.ts --reporter=line
```

Results for implementation commit `80115a20127002538dcdc51ba60ade75679fe24d`: TypeScript passed; ESLint passed; 5 Vitest files / 15 tests passed; production build passed; static Pages build passed; full-app and static-export journeys passed; dark-theme evidence was captured at all requested viewports.

The release-candidate evidence manifest records full local URLs, themes, provenance modes, build identifiers, source commit, and capture source. It is packaged under `BuildWiseArtifacts/release-candidate/`.

## Evidence

The screenshot manifest is `artifacts/final-screenshots/manifest.json`. It records the source commit, route, viewport, and capture timestamp for every fresh screenshot. Superseded root-level screenshots were archived under `artifacts/archive-superseded/` and are not part of the final evidence set.

## Remaining limitations

Live provider execution remains unverified until a user supplies a provider endpoint and credential through the session-only settings flow. Contract-accurate mocked responses verify adapter behavior, but they do not prove provider availability, contractual pricing, production latency, or production model quality.

## Productization artifacts

- `FINAL_PRODUCTIZATION_PLAN.md` records the acceptance criteria and implementation boundary.
- `TOKEN_COST_METHODOLOGY.md` defines token, retry, cache, fallback, pricing, and provenance mechanics.
- `SECURITY_AND_BYOK.md` documents the session-only key boundary and public-demo restrictions.
- `GITHUB_PAGES_DEPLOYMENT.md` documents the Pages workflow and expected repository-scoped URL.
- `RELEASE_EVIDENCE_AUDIT.md` records the pre-correction source audit.
- `STATIC_EXPORT_VALIDATION.md` records the repository-base-path static journey.
- `DEPLOYMENT_EVIDENCE.md` records the GitHub Actions and public-URL limitation.
