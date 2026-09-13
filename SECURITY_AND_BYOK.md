# Security and BYOK boundary

## Public demo

The public demo is credential-free. It uses seeded inputs, deterministic calculations, simulated controlled tests, and explicit demo provenance. It must never call a paid provider or embed a credential in static output.

## Full application

The full application supports explicit provider configuration and controlled execution. Provider secrets are held in session memory and removed before project persistence. A live run requires a successfully validated provider and an explicit user action. The application must not silently substitute a mock result for a failed live call.

## Browser persistence

Non-secret project state and theme preference may be stored locally. Provider API keys, authorization headers, and raw credentials must not be stored in localStorage, sessionStorage, exports, screenshots, or logs.

## Threat model

The browser-facing prototype is suitable for demo and controlled evaluation. Production deployment should place live provider adapters behind a server-side session boundary, apply authentication and authorization, redact request logs, enforce provider allowlists, and use a managed secret store. GitHub Pages is not a suitable host for live BYOK execution.

## Runtime dependency baseline

The server-capable application uses Next.js 16.3.4 and AI SDK 6.0.214 or later compatible patch releases. This baseline remediates the production advisories present in Next.js 16.2.4 and AI SDK 6.0.168 without changing BuildWise routing, economics, model selection, provider request contracts, credential handling, public-demo restrictions, or visual behavior. React and React DOM remain on 19.2.4 because they satisfy the patched Next.js peer range.

## Local-only NVIDIA verification procedure

Use a standalone server-capable build only. Never paste a provider key into chat, source code, terminal history, screenshots, browser recordings, URLs, analytics, exports, or committed files.

1. Run `npm run build` and then `npm run start`.
2. Open Provider Settings and select NVIDIA.
3. Select `nvidia/nemotron-3.5-lightning-30b-a3b`, enter the key directly in the browser, then run a Provider Connection Test.
4. Enable the browser session and run a Controlled Model Test.
5. Inspect sanitized provenance.

A successful Live Provider Test identifies NVIDIA, the requested and returned model when supplied, `fallback=false`, provider-reported usage when supplied, measured latency, a calculated cost only with verified pricing, and a safe request ID when supplied. It must explicitly state that no fallback was used. A rejected request remains a sanitized failure.
