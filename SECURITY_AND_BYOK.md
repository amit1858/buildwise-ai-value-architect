# Security and BYOK boundary

## Public demo

The public demo is credential-free. It uses seeded inputs, deterministic calculations, simulated controlled tests, and explicit demo provenance. It must never call a paid provider or embed a credential in static output.

## Full application

The full application supports explicit provider configuration and controlled execution. Provider secrets are held in session memory and removed before project persistence. A live run requires a successfully validated provider and an explicit user action. The application must not silently substitute a mock result for a failed live call.

## Browser persistence

Non-secret project state and theme preference may be stored locally. Provider API keys, authorization headers, and raw credentials must not be stored in localStorage, sessionStorage, exports, screenshots, or logs.

## Threat model

The browser-facing prototype is suitable for demo and controlled evaluation. Production deployment should place live provider adapters behind a server-side session boundary, apply authentication and authorization, redact request logs, enforce provider allowlists, and use a managed secret store. GitHub Pages is not a suitable host for live BYOK execution.
