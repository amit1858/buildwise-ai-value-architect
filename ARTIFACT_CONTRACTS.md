# BuildWise artifact contracts

Every generated artifact must identify its project, source decisions, provenance, and intended owner.

| Artifact | Minimum contents |
|---|---|
| Executive brief | Outcome, users, value hypothesis, constraints, recommendation |
| Suitability assessment | Task classifications, deterministic boundary, risks, review gates |
| Task decomposition | Inputs, outputs, complexity, context, model need, fallback |
| Routing matrix | Primary/fallback provider and model, calls, retries, cache, escalation |
| Prompt pack | Task-specific instructions, schema, retrieval policy, validation, escalation |
| Token/cost forecast | Instruction, variable input, retrieved context, output allowance, retries, fallbacks, total expected tokens, cost |
| Build path guide | Selected path, alternatives, strengths, trade-offs, ownership |
| Evaluation plan | Golden cases, quality thresholds, safety checks, acceptance gates |
| Observability plan | Usage, cost, latency, errors, quality, drift, alert thresholds |
| Risk register | Risk, impact, likelihood, control, owner, review cadence |

Public-demo artifacts must never contain credentials or imply provider-reported usage when the source is a simulation or mock adapter.
