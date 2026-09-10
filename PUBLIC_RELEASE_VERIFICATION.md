# Public release verification

**Status:** Verified against the deployed GitHub Pages site after the public-demo controlled-test fix.

## Release identity

- Repository: https://github.com/amit1858/buildwise-ai-value-architect
- Pages URL: https://amit1858.github.io/buildwise-ai-value-architect/
- Source commit: `d0516218f046cc907d0e778898136151c8dfcaa6`
- Workflow: [34432224850](https://github.com/amit1858/buildwise-ai-value-architect/actions/runs/34432224850), successful
- Pages publishing mode: GitHub Actions

## Routes and values

Direct navigation and refresh returned HTTP 200 for `/`, `/workspace/demo-support-project/spine/`, `/workflow/`, `/scenarios/`, `/prompts/`, `/test/`, `/blueprint/`, and `/settings/providers/`. The deployed scenario page showed monthly volume 100,000, budget $12,000, Baseline $39,308.23, Economy $173.15 with 99.6% savings, Balanced $771.27 with 98.0% savings, and Assurance $24,128.48 with 38.6% savings. Balanced displayed 0% premium-model share and did not claim premium routing.

The calculation drawer reconciled to the displayed Balanced total. Prompt and retrieval terminology was reviewed, including “fewer expected tokens per request” and retrieval-policy language. Controlled test output was labelled “Simulated demo result” and “Mocked provider response”; no simulated result was labelled actual or live.

## Responsive and theme checks

Checked 390x844, 768x1024, 1280x900, 1440x1000, and 1920x1080 across all primary routes. No horizontal overflow was observed. Light, dark, and system themes were exercised; system light and dark followed emulated OS preference, and the selected theme persisted after refresh.

## Browser and network results

The final clean-browser run completed without new console errors. Network inspection after the fix showed only same-site static and Next.js navigation resources; no provider endpoint was contacted. The prior defect was a base-path API call from the public demo and was corrected by executing the demo mock adapter locally.

## Evidence

Fresh screenshots and the capture manifest are in `artifacts/public-release-evidence/`. All application screenshots use the public Pages URL as their source.
