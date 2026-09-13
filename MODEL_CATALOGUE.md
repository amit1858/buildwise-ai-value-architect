# Model catalogue

BuildWise keeps the provider/model catalogue typed in `lib/buildwise.ts`. Shared NVIDIA Build endpoint and model constants live in `lib/model-registry.ts`.

## NVIDIA Build

- Canonical model: `nvidia/nemotron-3.5-lightning-30b-a3b`
- API base: `https://integrate.api.nvidia.com/v1`
- Route: `/chat/completions`
- Protocol: OpenAI-compatible JSON with `stream: false` for a Controlled Model Test
- Recommended model metadata: temperature `1.0`, top-p `0.95`
- Pricing provenance: unavailable until verified catalogue pricing is configured; provider-reported usage alone does not fabricate pricing.

Provider Settings filters catalogue models by provider and capability, displays metadata, and preserves a custom-model identifier fallback. Azure deployment names remain separate from model-family identity.
