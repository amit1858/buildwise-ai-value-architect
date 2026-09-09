# BuildWise

**BuildWise turns an enterprise AI idea into a cost-aware operating blueprint—decomposing the workflow, routing each task to the right model, forecasting token spend and showing where advanced reasoning creates enough value to justify its cost.**

## The enterprise problem

AI proposals often start with a model choice instead of an operating design. That makes cost, quality, governance, fallback behavior, and human review difficult to explain before implementation.

## What BuildWise does

BuildWise is an AI Value Architect for:

- cost-aware prompt optimization;
- lightweight model-selection heuristics;
- budget-guided orchestration;
- deterministic-first execution;
- model fallback policies;
- caching and retry economics;
- feedback and calibration;
- proactive AI cost management.

## Why this is different

BuildWise makes the economics auditable at task level. It shows which work is deterministic, which model is selected, how context and output budgets are estimated, how retries and fallbacks affect cost, and where human review belongs.

## Interactive demo

The public demo is designed for GitHub Pages:

`https://amit1858.github.io/buildwise-ai-value-architect/`

The URL is valid only after the Pages workflow completes successfully.

## Product journey

Use case → Workload decomposition → Task classification → Model/provider routing → Prompt optimization → Token and cost forecast → Scenario comparison → Controlled validation → Exportable blueprint

## Scenario methodology

The seeded customer-support scenario compares Baseline, Economy, Balanced, and Assurance policies. Each policy independently determines model routing, context, output allowance, retries, fallback behavior, cache assumptions, escalation, and human review. See [DEMO_GOLDEN_VALUES.md](DEMO_GOLDEN_VALUES.md) and [TOKEN_COST_METHODOLOGY.md](TOKEN_COST_METHODOLOGY.md).

## Architecture

The App Router UI is backed by typed domain calculations in `lib/buildwise.ts`, provider contracts in `lib/provider-adapters.ts`, session-only provider handling, and explicit provenance for demo, mocked, and live-capable paths.

## Public demo versus full application

GitHub Pages serves the credential-free seeded demo. Provider-backed execution requires the server-capable full application. Public-demo builds block provider validation and execution; no API key is required or persisted.

## BYOK providers

The full application includes contracts for Azure OpenAI, OpenAI, Anthropic, NVIDIA/NIM, generic OpenAI-compatible endpoints, and Ollama/local models. Keys are session-only and are never persisted to browser storage or exports.

## Security model

Read [SECURITY_AND_BYOK.md](SECURITY_AND_BYOK.md). GitHub Pages is intentionally not used for live BYOK execution.

## Running locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Running tests

```bash
npm run typecheck
npm run lint
npm test
npm run build
PUBLIC_DEMO=true npm run build:pages
```

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` derives the repository base path from `GITHUB_REPOSITORY`, builds `PUBLIC_DEMO=true`, uploads `out/`, and deploys through the official GitHub Pages actions. See [GITHUB_PAGES_DEPLOYMENT.md](GITHUB_PAGES_DEPLOYMENT.md).

## Evidence and limitations

The demo uses catalogue assumptions and simulated or mocked execution evidence. No provider capability is claimed as live without provider-reported usage from a real, explicitly validated connection. The methodology, security boundary, and seeded golden values are documented in this repository.

## Roadmap

- production authentication and authorization;
- server-side provider sessions;
- managed secret storage;
- provider-specific pricing imports;
- broader benchmark and feedback calibration.

## Author

Built by **Amit Pandey** as an exploration of proactive enterprise AI cost management.

## Licence

This project is licensed under the [MIT License](LICENSE).
