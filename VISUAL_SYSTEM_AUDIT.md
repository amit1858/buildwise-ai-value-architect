Reading this as: an enterprise AI solution-design product for product, engineering, governance, and finance leaders, with a premium technical and editorial public story and a precise, high-trust operational workspace.

## Design settings

| Product layer | Design variance | Motion intensity | Visual density | Application |
| --- | ---: | ---: | ---: | --- |
| Public story | 7 | 5 | 4 | Asymmetric editorial landing, product-story hierarchy, restrained reveal motion, burnt-amber accent system. |
| Workspace | 4 | 2 | 7 | Operational grids, tighter information hierarchy, predictable controls, compact data presentation, full interaction states. |

## Radius rule

| Surface | Radius |
| --- | ---: |
| Page or major panel | 14px |
| Nested panel | 8px |
| Form control | 7px |
| Status badge | Compact pill |
| Primary button | 8px |
| Icon button | 8px |

## Audit baseline and corrections

| Area | Finding | Correction |
| --- | --- | --- |
| Typography | The app already used Geist, but data values did not consistently use tabular figures and some headings lacked balanced wrapping. | Kept Geist Sans and Geist Mono, added tabular-number defaults for data-heavy surfaces, and added balanced wrapping utilities for display headings. |
| Colour | Warm stone surfaces were present, but pure white panels and charcoal buttons created a generic SaaS card rhythm. | Unified the app around warm neutral tokens, considered charcoal, and burnt amber as the single accent family. |
| Layout | The landing relied on a common hero plus equal three-card feature row. | Rebuilt the landing as an asymmetric public story with a decision-system visual, varied sections, and tighter CTA discipline. |
| Workspace | Dense routes used repeated large cards and pill buttons across operational controls. | Added global radius, surface, focus, hover, active, disabled, and tabular-number rules without changing route behavior. |
| Interaction states | Buttons had hover in some places but inconsistent active, disabled, and focus treatment. | Added global interactive states and retained disabled states where product logic requires them. |
| Public safety | BYOK and public-demo restrictions needed to remain clear after visual changes. | Preserved public-demo wording, provider boundaries, and credential-free export behavior. |
