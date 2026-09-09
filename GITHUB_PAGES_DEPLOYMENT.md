# GitHub Pages deployment

The repository includes a Pages workflow at `.github/workflows/deploy-pages.yml`.

The workflow builds `PUBLIC_DEMO=true`, derives the project-site base path from `GITHUB_REPOSITORY`, uploads the static artifact, and deploys it with the official GitHub Pages actions. The public build contains only seeded/user-editable simulation behavior; live BYOK execution is disabled in this mode.

Repository:

`amit1858/buildwise-ai-value-architect`

Expected URL:

`https://amit1858.github.io/buildwise-ai-value-architect/`

The URL is not claimed as verified until the workflow completes successfully and the deployed URL returns the application.
