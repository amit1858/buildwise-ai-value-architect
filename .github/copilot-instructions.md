# Copilot instructions for BuildWise

- Keep the workspace aligned to the selected scenario and build path.
- Current build path: Hybrid
- Quality sensitivity: high
- Keep deterministic router logic separate from model-assisted reasoning.
- Never expose provider credentials or live provider keys in public-demo outputs or exported files.
- When a task is deterministic, prefer deterministic execution paths and label them as deterministic rather than as billed model calls.
- Preserve the public-demo restriction: no provider-backed execution in static GitHub Pages mode.

## Guardrails

- Never log API keys, tokens, or authorization headers.
- Prefer mock or simulated outputs for demo and public artifacts.
- Keep workflow routing, scenario economics, and implementation guidance synchronized.
