# Runtime restoration transfer matrix

## Historical implementation provenance

The historical source reference supplied during transfer was
[`pandeyamit_microsoft/buildwise-copilot#2`](https://github.com/pandeyamit_microsoft/buildwise-copilot/pull/2),
commit `65ec8ea23a18c31f2ba33fffd64cb716f53d87e6`. Its current status could not be
independently verified because the authenticated GitHub account cannot access
that repository. It is read-only historical provenance, not an active
dependency. The reconciled implementation and all active development now live
in [`amit1858/buildwise-ai-value-architect`](https://github.com/amit1858/buildwise-ai-value-architect).
Source Git history was not copied.

| Source file | Target equivalent | Action | Conflict risk | Verification |
| --- | --- | --- | --- | --- |
| `lib/model-registry.ts` | `lib/model-registry.ts` | Added shared NVIDIA constants | Low | Unit tests |
| `lib/provider-adapters.ts` | `lib/provider-adapters.ts` | Adapted endpoint, request, sanitization, and usage logic | Medium | Adapter tests |
| `lib/buildwise.ts` | `lib/buildwise.ts` | Added metadata and NVIDIA catalogue entry without economics changes | Medium | Cost and registry tests |
| `components/providers/ProviderSettings.tsx` | same | Adapted catalogue selector and public boundaries while retaining target layout | Medium | Typecheck and build |
| `app/globals.css` | same | Added scoped provider semantics; retained target public styling | Medium | Theme test |
| `next.config.ts`, `vercel.json` | same | Added standalone/public flags and target config | Low | Both builds |
| `scripts/check-utf8.mjs`, `package.json` | same | Added UTF-8 scan command | Low | Scan |
| Runtime tests | `tests/*.test.ts` | Added focused provider, registry, and boundary coverage | Low | Vitest |
| Runtime documentation | target Markdown files | Added target-specific deployment, catalogue, and theme docs | Low | Terminology scan |
