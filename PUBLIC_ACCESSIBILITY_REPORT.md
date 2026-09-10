# Public accessibility report

Manual accessibility checks covered keyboard focus visibility, semantic headings, labelled theme and workflow controls, scenario comparison table semantics, explicit status/provenance text, and dismissible calculation-drawer controls. The calculation drawer exposes a labelled close control, and the public demo communicates provenance with text rather than colour alone.

Responsive snapshots were checked at 390x844, 768x1024, 1280x900, 1440x1000, and 1920x1080 without horizontal overflow. System light and dark preferences were exercised.

No separate automated accessibility package was present in the repository, so no new dependency was introduced for this release evidence pass. A full assistive-technology audit remains outside this deployment verification.
