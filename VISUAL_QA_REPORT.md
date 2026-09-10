# BuildWise visual QA report

## Scope

Applied the pinned Taste Skill design-quality framework as an audit method, not as a component library. The public landing uses the Taste frontend method. Intake, provider settings, methodology, workspace routes, Build Kit, scenarios, prompts, controlled testing, and blueprint use the redesign-existing-projects method with selective minimalist guidance for dense document and data views.

## Route audit

| Route | Failures found | Corrections made | Status |
| --- | --- | --- | --- |
| `/` | Generic equal feature cards, repetitive white-card surfaces, pill CTAs, limited visual system story. | Rebuilt the landing with asymmetric composition, one accent family, restrained reveal motion, decision-system visual, varied proof sections, and direct BuildWise language. | Passed |
| `/new` | Dense form worked but used pill actions and generic surfaces. | Global radius, focus, active, disabled, warm-surface, and tabular-number rules now apply without changing field order or behavior. | Passed |
| `/methodology` | Document preview used repeated cards and sparse interaction styling. | Global surface and radius rules reduce generic card feel while keeping readable document hierarchy. | Passed |
| `/settings/providers` | Provider controls used rounded-pill actions and relied on alert-style behavior only through validation messages. | Global button radius and states apply. Provider validation remains inline through existing validation message panels. | Passed |
| `/workspace/[projectId]/spine` | Dense operational cards had repeated radius and shadow treatment. | Global major-panel and nested-panel radius rules, warm surfaces, and tabular data styling apply. | Passed |
| `/workspace/[projectId]/workflow` | Workflow table required compact operational readability and predictable editing states. | Preserved table workflow, added consistent control states and no experimental marketing patterns. | Passed |
| `/workspace/[projectId]/scenarios` | Economic comparison needed tabular figures and clearer active state. | Global tabular-number and interaction rules apply while preserving scenario selection behavior. | Passed |
| `/workspace/[projectId]/prompts` | Prompt comparisons needed document-style readability. | Preserved two-column comparison and applied minimalist nested surface treatment. | Passed |
| `/workspace/[projectId]/test` | Controlled tests used browser alerts for failure/confirmation. | Replaced blocking alert/confirm behavior with inline notice state and explicit run controls. | Passed |
| `/workspace/[projectId]/build-kit` | Artifact preview was functionally complete but used pill export buttons and generic panels. | Global action radius, focus, hover, active, and document-preview styling apply. | Passed |
| `/workspace/[projectId]/blueprint` | Export controls had repetitive pill actions and proportional numbers. | Global action radius and tabular-number rules apply while preserving export behavior. | Passed |

## Pre-flight checks

| Check | Result |
| --- | --- |
| Design read recorded | Passed |
| Public story dials recorded | Passed |
| Workspace dials recorded | Passed |
| Single accent family | Passed |
| Radius rule documented and implemented | Passed |
| Browser-default typography avoided | Passed |
| Tabular values supported | Passed |
| CTA discipline improved | Passed |
| Repetitive three-equal-card landing pattern removed | Passed |
| Workspace kept operational, not experimental | Passed |
| Hover, active, focus, and disabled states present | Passed |
| Public-demo truthfulness preserved | Passed |
| Reduced-motion respected for landing reveal motion | Passed |
| Mobile layouts collapse through grid breakpoints | Passed |
