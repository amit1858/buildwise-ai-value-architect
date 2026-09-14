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
        ? { pageBg: "#080b0f", pageFg: "#f4f7f5", surface: "#0f151b", surfaceFg: "#f4f7f5" }
        : { pageBg: "#f5f7f4", pageFg: "#101612", surface: "#fff", surfaceFg: "#101612" };
      expect(tokens).toEqual(expectedTokens);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
    });
  }

  test("reported contrast regressions and focus treatment remain corrected", async ({ page }) => {
    await openWithTheme(page, "/", "dark", "light");
    await expect(page.getByRole("button", { name: "Start blueprint" })).toBeVisible();
    await expect(page.getByText("Recommended policy", { exact: true })).toBeVisible();
    await expect(page.getByText("Architecture and trust boundary", { exact: true })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);

    await page.getByRole("button", { name: "Start blueprint" }).focus();
    const focus = await page.getByRole("button", { name: "Start blueprint" }).evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focus.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);

    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Explore customer-support demo" }).click();
    await page.getByRole("link", { name: "Build path" }).click();
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
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

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

    await page.setViewportSize({ width: 390, height: 844 });
    await openWithTheme(page, "/results", "dark", "dark");
    await expectNoSeriousAccessibilityViolations(page);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(mobileOverflow, "populated results overflowed at 390x844").toBeLessThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });

  test("desktop header keeps theme control separate from workspace action", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openWithTheme(page, "/", "dark", "dark");
    const themeBox = await page.locator(".site-actions select").boundingBox();
    const workspaceBox = await page.getByRole("button", { name: "Open workspace" }).boundingBox();
    expect(themeBox).not.toBeNull();
    expect(workspaceBox).not.toBeNull();
    const overlaps = !(
      themeBox!.x + themeBox!.width <= workspaceBox!.x ||
      workspaceBox!.x + workspaceBox!.width <= themeBox!.x ||
      themeBox!.y + themeBox!.height <= workspaceBox!.y ||
      workspaceBox!.y + workspaceBox!.height <= themeBox!.y
    );
    expect(overlaps).toBe(false);
  });

  test("dark navigation text meets contrast requirements", async ({ page }) => {
    await openWithTheme(page, "/", "dark", "dark");
    const ratios = await page.locator(".site-nav a").evaluateAll((links) => {
      const luminance = (value: string) => {
        const channels = value.match(/\d+/g)!.slice(0, 3).map(Number).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      return links.map((link) => {
        const style = getComputedStyle(link);
        const parentStyle = getComputedStyle(link.closest(".site-header")!);
        const foreground = luminance(style.color);
        const background = luminance(parentStyle.backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
    });
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
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
    await page.getByRole("button", { name: "Explore customer-support demo" }).click();
    await page.getByRole("link", { name: "Build path" }).click();
    await expect(page).toHaveScreenshot("build-path-dark.png", { fullPage: true, maxDiffPixelRatio: 0.01 });
  });
});
