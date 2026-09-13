# BuildWise deployment architecture

## Deployment modes

| Capability | GitHub Pages | Standalone server application |
| --- | --- | --- |
| Build setting | `PUBLIC_DEMO=true` | `PUBLIC_DEMO=false` or unset |
| Runtime | Static export | Next.js server |
| Provider keys | Blocked | Browser-session only |
| Provider API routes | Return HTTP 403 | Available for explicit validation and controlled tests |
| Provider execution | Simulated Demo Test only | Controlled Model Test, when configured |
| Provenance | `demo-simulation` or `mock-adapter` | `demo-simulation`, `mock-adapter`, or `live-provider` |

GitHub Pages remains the credential-free public showcase and must not be used for live BYOK. `vercel.json` prepares a server-capable deployment target; no standalone URL is configured or claimed.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PUBLIC_DEMO` | Enables public-showcase restrictions only when `true`. |
| `STANDALONE_APP_URL` | Optional public CTA for an independently deployed standalone app. |
| `NEXT_PUBLIC_BUILDWISE_PUBLIC_DEMO` | Generated client flag derived from `PUBLIC_DEMO`. |
| `NEXT_PUBLIC_BUILDWISE_STANDALONE_URL` | Generated client flag derived from `STANDALONE_APP_URL`. |
