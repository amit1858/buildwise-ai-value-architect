# BuildWise deployment evidence

## Deployment

- Repository: `amit1858/buildwise-ai-value-architect`
- Public URL: https://amit1858.github.io/buildwise-ai-value-architect/
- Source commit deployed: `9f48947d304c1d1dc69316e59e0a04195499110b`
- Workflow run: [34451318084](https://github.com/amit1858/buildwise-ai-value-architect/actions/runs/34451318084)
- Workflow status: success
- Pages publishing source: GitHub Actions

## Verification

The deployed Playwright journey passed against the exact Pages URL at 1440x1000, 1280x900, 834x1112, and 390x844. It covered landing, Workload spine, editable Workflow, Scenarios, calculation drawer, Prompts, simulated test result, AI suitability, Build path selection, Build Kit, Blueprint, and Provider settings.

The public demo result is labelled `Simulated demo result`, states that it was generated locally using the demo adapter, and states that no paid provider call was made. Live provider testing is visibly disabled in the public build. Provider keys cannot be entered, validated, or used through GitHub Pages.

The browser storage audit found no credential-shaped values. The deployed route checks returned HTTP 200 for the landing page and all restored workspace routes. The Pages workflow completed checkout, locked dependency installation, type checking, linting, Vitest, static export, artifact upload, and deployment successfully.

## Evidence files

- `deployment-manifest.json`
- `landing-light.png`
- `landing-dark.png`
- `scenario-comparison.png`
- `prompt-comparison.png`
- `landing-mobile.png`
- `workload-spine.png`
- `editable-routing-drawer.png`
- `calculation-drawer.png`
- `simulated-result.png`
- `build-kit.png`
