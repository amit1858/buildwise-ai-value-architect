import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

type ThemePreference = "light" | "dark" | "system";

const seededResult = {
  input: {
    problem: "Create a governed internal support assistant.",
    persona: "Operations lead",
    goal: "Reduce support triage time",
    constraints: "Use approved data sources only",
    builderType: "pro-code",
  },
  decisionSpine: {
    productType: "Internal assistant",
    complexity: "Medium",
    mvpWedge: "Support triage",
    constraints: ["Approved data only", "Human review"],
    recommendedModules: ["Solution blueprint", "Evaluation plan"],
    personaType: "Operations lead",
    builderType: "pro-code",
  },
  modules: {
    blueprint: {
      title: "Solution blueprint",
      summary: "A controlled retrieval workflow with explicit review boundaries.",
      keyDecision: "Keep deterministic routing separate from model-assisted reasoning.",
      reasoning: "This preserves predictable workflow behavior and auditable model use.",
      tradeoffs: ["More explicit orchestration", "Clearer operational ownership"],
      risks: ["Source drift"],
      nextSteps: ["Confirm source owners", "Define evaluation cases"],
    },
  },
  executionStrategy: {
    builderType: "pro-code",
    executionMode: "Hybrid build",
    summary: "Use deterministic routing with a bounded model-assisted synthesis step.",
    outputs: [
      { label: "Implementation note", type: "text", content: "Keep provider credentials session-memory-only." },
      { label: "Builder prompt", type: "prompt", content: "Draft the support response using only approved context." },
      { label: "File structure", type: "code", content: "app/\n  api/\n  workspace/" },
    ],
    nextSteps: ["Validate the controlled test set", "Review provider boundaries"],
  },
  metadata: {
    generatedAt: "2026-01-01T12:00:00.000Z",
    version: "1.0",
    mode: "mock",
    modulesGenerated: 1,
    builderType: "pro-code",
  },
};

const routes = [
  "/",
  "/new",
  "/results",
  "/methodology",
  "/settings/providers",
  "/workspace/demo-support-project/spine",
  "/workspace/demo-support-project/workflow",
  "/workspace/demo-support-project/scenarios",
  "/workspace/demo-support-project/prompts",
  "/workspace/demo-support-project/test",
  "/workspace/demo-support-project/blueprint",
  "/workspace/demo-support-project/build-kit",
];

async function openWithTheme(page: Page, route: string, preference: ThemePreference, browserPreference: "light" | "dark") {
  await page.emulateMedia({ colorScheme: browserPreference, reducedMotion: "reduce" });
  await page.addInitScript((theme) => localStorage.setItem("buildwise-theme", theme), preference);
  await page.goto(route, { waitUntil: "networkidle" });
}

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
}

test.describe("BuildWise visual accessibility", () => {
  test.setTimeout(120_000);

  for (const theme of ["light", "dark", "system"] as const) {
    test(`${theme} theme has no serious route-level accessibility violations`, async ({ page }) => {
      const browserPreference = theme === "system" ? "dark" : "light";
      for (const route of routes) {
        await openWithTheme(page, route, theme, browserPreference);
        await expectNoSeriousAccessibilityViolations(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${route} overflowed in ${theme}`).toBeLessThanOrEqual(1);
      }
    });
  }

  const combinations: Array<[ThemePreference, "light" | "dark", "light" | "dark"]> = [
    ["light", "dark", "light"],
    ["light", "light", "light"],
    ["dark", "light", "dark"],
    ["dark", "dark", "dark"],
    ["system", "light", "light"],
    ["system", "dark", "dark"],
  ];

  for (const [preference, browserPreference, expected] of combinations) {
    test(`${preference} selection with ${browserPreference} browser preference resolves complete ${expected}`, async ({ page }) => {
      await openWithTheme(page, "/", preference, browserPreference);
      await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
      const tokens = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return {
          pageBg: style.getPropertyValue("--page-bg").trim(),
          pageFg: style.getPropertyValue("--page-fg").trim(),
          surface: style.getPropertyValue("--surface-primary").trim(),
          surfaceFg: style.getPropertyValue("--surface-primary-fg").trim(),
        };
      });
      const expectedTokens = expected === "dark"
        ? { pageBg: "#17130f", pageFg: "#f4ede3", surface: "#211b16", surfaceFg: "#f4ede3" }
        : { pageBg: "#f6f1e8", pageFg: "#2a241f", surface: "#fffaf2", surfaceFg: "#2a241f" };
      expect(tokens).toEqual(expectedTokens);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
    });
  }

  test("reported contrast regressions and focus treatment remain corrected", async ({ page }) => {
    await openWithTheme(page, "/", "dark", "light");
    await expect(page.getByRole("link", { name: "Start blank" })).toBeVisible();
    await expect(page.getByText("Balanced route", { exact: true })).toBeVisible();
    await expect(page.getByText("Governance posture", { exact: true })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);

    await page.getByRole("link", { name: "Start blank" }).focus();
    const focus = await page.getByRole("link", { name: "Start blank" }).evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focus.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);

    await page.goto("/workspace/demo-support-project/build-path", { waitUntil: "networkidle" });
    await expect(page.getByText("Pro-code", { exact: true })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);

    await page.goto("/settings/providers", { waitUntil: "networkidle" });
    await expect(page.getByText("Selected provider", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Configure" }).nth(1).click();
    await page.getByLabel("OpenAI model selection").selectOption("__custom__");
    await expect(page.getByLabel("Custom model identifier")).toBeFocused();
    await expectNoSeriousAccessibilityViolations(page);

    await page.goto("/workspace/demo-support-project/test", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Run demo test" })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("populated results remain accessible in light and dark themes", async ({ page }) => {
    await page.addInitScript((result) => {
      sessionStorage.setItem("buildwise_result", JSON.stringify(result));
    }, seededResult);

    for (const theme of ["light", "dark"] as const) {
      await openWithTheme(page, "/results", theme, theme);
      await expect(page.getByRole("heading", { name: "Your Build Plan" })).toBeVisible();
      await expectNoSeriousAccessibilityViolations(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `populated results overflowed in ${theme}`).toBeLessThanOrEqual(1);
    }
  });

  test("representative routes remain usable at required responsive viewports", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 1000 },
      { width: 1280, height: 800 },
      { width: 820, height: 1180 },
      { width: 390, height: 844 },
    ];
    const representativeRoutes = ["/", "/settings/providers", "/workspace/demo-support-project/workflow", "/workspace/demo-support-project/build-kit"];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const route of representativeRoutes) {
        await openWithTheme(page, route, "dark", "dark");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${route} overflowed at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
        await expectNoSeriousAccessibilityViolations(page);
      }
    }
  });

  test("stable seeded visual baselines", async ({ page }) => {
    await openWithTheme(page, "/", "light", "dark");
    await expect(page).toHaveScreenshot("landing-light.png", { fullPage: true, maxDiffPixelRatio: 0.01 });
    await openWithTheme(page, "/", "dark", "light");
    await expect(page).toHaveScreenshot("landing-dark.png", { fullPage: true, maxDiffPixelRatio: 0.01 });
    await page.goto("/workspace/demo-support-project/build-path", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot("build-path-dark.png", { fullPage: true, maxDiffPixelRatio: 0.01 });
  });
});
