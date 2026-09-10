# Public security audit

- Public-demo provider execution and validation are disabled server-side.
- The controlled demo test now uses the local mock adapter in static public-demo builds; it makes no API request.
- Browser storage contained only `buildwise-theme` and the non-secret seeded `buildwise-projects` state after the controlled test.
- Cookies were empty during verification.
- No provider API key, bearer token, authorization header, private endpoint, internal repository reference, or local Windows path was found in the checked public snapshot or captured browser state.
- The deployed route and static assets were served from the repository base path; no source maps or provider calls were observed.
- The public repository is MIT-licensed and contains no internal deployment-failure evidence.

The full application’s BYOK capability remains intentionally separate from the credential-free GitHub Pages demo.
