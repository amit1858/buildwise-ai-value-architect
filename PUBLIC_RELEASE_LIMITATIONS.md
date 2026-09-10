# Public release limitations

- GitHub Pages serves a static, seeded public demo; live provider execution and BYOK validation are not available there.
- Demo catalogue prices and simulated usage are estimates, not provider-reported billing.
- Browser verification used Playwright against the deployed site. The final clean run had no new console errors and no provider requests; historical console output from the pre-fix page included the now-corrected base-path 405.
- Manual accessibility checks were completed, but a full screen-reader and assistive-technology audit was not performed.
- The deployment workflow reports a non-blocking GitHub Actions Node.js 20 deprecation annotation from the official actions.
